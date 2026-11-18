# Slack links

Each file here links a Slack member to the profile they may edit from Slack with the
Latina Dev app (`/latinadev` or its Home tab). The filename is the profile slug, e.g.
`frances-coronel.txt`, and the file holds the SHA-256 of `slack:<workspace id>:<member id>`,
never the raw Slack id.

A member links by pressing **Link with LinkedIn** in Slack and signing in on latina.dev with the
LinkedIn account that owns the profile. That opens a pull request adding the file, which an
organizer approves in Slack like any profile change. Delete a file to unlink it.

Scripts can find the profile for a Slack member with `linkedSlug(teamId, userId)` from
`lib/slackLinks.ts`.
