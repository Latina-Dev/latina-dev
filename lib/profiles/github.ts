// GitHub REST and GraphQL calls that turn profile submissions into pull requests.
// Uses a token with contents and pull request write access to this repo only.

const repo = "Latina-Dev/latina-dev";
const baseBranch = "main";
const api = "https://api.github.com";

class GitHubError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

const github = async <T>(path: string, init: { method?: string; body?: unknown } = {}) => {
  const token = process.env.PROFILE_BOT_GITHUB_TOKEN;
  if (!token) throw new Error("PROFILE_BOT_GITHUB_TOKEN is not set");
  const response = await fetch(`${api}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  if (!response.ok) {
    throw new GitHubError(
      `GitHub ${init.method ?? "GET"} ${path} failed: ${response.status} ${await response.text()}`,
      response.status
    );
  }
  return (response.status === 204 ? undefined : await response.json()) as T;
};

export interface RepoFile {
  path: string;
  content: string | Buffer;
}

/**
 * Put files on a branch as one commit on top of main, replacing whatever the branch held before
 * @param branch e.g. profile/0123456789ab
 * @param files files to add or overwrite
 * @param message commit message
 */
export const commitToBranch = async (branch: string, files: RepoFile[], message: string) => {
  const ref = await github<{ object: { sha: string } }>(
    `/repos/${repo}/git/ref/heads/${baseBranch}`
  );
  const parent = await github<{ tree: { sha: string } }>(
    `/repos/${repo}/git/commits/${ref.object.sha}`
  );

  const tree = await Promise.all(
    files.map(async (file) => {
      const blob = await github<{ sha: string }>(`/repos/${repo}/git/blobs`, {
        method: "POST",
        body: { content: Buffer.from(file.content).toString("base64"), encoding: "base64" },
      });
      return { path: file.path, mode: "100644", type: "blob", sha: blob.sha };
    })
  );

  const newTree = await github<{ sha: string }>(`/repos/${repo}/git/trees`, {
    method: "POST",
    body: { base_tree: parent.tree.sha, tree },
  });
  const commit = await github<{ sha: string }>(`/repos/${repo}/git/commits`, {
    method: "POST",
    body: { message, tree: newTree.sha, parents: [ref.object.sha] },
  });

  try {
    await github(`/repos/${repo}/git/refs/heads/${branch}`, {
      method: "PATCH",
      body: { sha: commit.sha, force: true },
    });
  } catch (error) {
    // The branch doesn't exist yet
    if (!(error instanceof GitHubError) || error.status !== 422) throw error;
    await github(`/repos/${repo}/git/refs`, {
      method: "POST",
      body: { ref: `refs/heads/${branch}`, sha: commit.sha },
    });
  }
};

interface PullRequest {
  number: number;
  html_url: string;
  node_id: string;
  state: "open" | "closed";
  merged: boolean;
  head: { ref: string; repo: { full_name: string } | null };
}

/**
 * Find the open pull request for a branch
 * @param branch e.g. profile/0123456789ab
 */
export const findOpenPull = async (branch: string) => {
  const owner = repo.split("/")[0];
  const pulls = await github<PullRequest[]>(
    `/repos/${repo}/pulls?state=open&head=${encodeURIComponent(`${owner}:${branch}`)}`
  );
  return pulls[0];
};

/**
 * Open a pull request for a branch, or update the one already open
 * @param branch e.g. profile/0123456789ab
 * @param title pull request title
 * @param body pull request description
 */
export const openOrUpdatePull = async (branch: string, title: string, body: string) => {
  const existing = await findOpenPull(branch);
  if (existing) {
    return github<PullRequest>(`/repos/${repo}/pulls/${existing.number}`, {
      method: "PATCH",
      body: { title, body },
    });
  }
  return github<PullRequest>(`/repos/${repo}/pulls`, {
    method: "POST",
    body: { title, body, head: branch, base: baseBranch },
  });
};

/**
 * Load a pull request, refusing any that isn't a profile submission so the Slack buttons
 * can only ever touch the pull requests this flow opened
 * @param number pull request number
 */
const getProfilePull = async (number: number) => {
  const pull = await github<PullRequest>(`/repos/${repo}/pulls/${number}`);
  if (!pull.head.ref.startsWith("profile/") || pull.head.repo?.full_name !== repo) {
    throw new Error(`#${number} is not a profile submission`);
  }
  return pull;
};

/**
 * Merge an approved profile pull request, or set it to merge once required checks pass
 * @param number pull request number
 * @returns what happened
 */
export const approvePull = async (number: number) => {
  const pull = await getProfilePull(number);
  if (pull.merged) return "already merged";
  if (pull.state === "closed") return "closed, so it was not merged";

  try {
    await github(`/repos/${repo}/pulls/${number}/merge`, {
      method: "PUT",
      body: { merge_method: "squash" },
    });
    return "merged";
  } catch (error) {
    // 405 means checks are still running or required checks failed, so queue it instead
    if (!(error instanceof GitHubError) || error.status !== 405) throw error;
  }

  const result = await github<{ errors?: { message: string }[] }>(`/graphql`, {
    method: "POST",
    body: {
      query: `mutation ($id: ID!) {
        enablePullRequestAutoMerge(input: { pullRequestId: $id, mergeMethod: SQUASH }) {
          clientMutationId
        }
      }`,
      variables: { id: pull.node_id },
    },
  });
  if (result.errors?.length) throw new Error(result.errors.map((e) => e.message).join("; "));
  return "set to merge once checks pass";
};

/**
 * Close a rejected profile pull request and delete its branch
 * @param number pull request number
 */
export const rejectPull = async (number: number) => {
  const pull = await getProfilePull(number);
  if (pull.merged) return "already merged, so it was not closed";
  // A stale button on an old message must not delete a branch the member has since reused
  if (pull.state === "closed") return "already closed";
  await github(`/repos/${repo}/pulls/${number}`, { method: "PATCH", body: { state: "closed" } });
  await github(`/repos/${repo}/git/refs/heads/${pull.head.ref}`, { method: "DELETE" });
  return "closed";
};
