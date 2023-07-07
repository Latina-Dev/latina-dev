import clientPromise from "../../database/mongodb";

export default async (req, res) => {
    try {
        const client = await clientPromise;

        const db = client.db("latinasdev");

        const members = await db
            .collection("members")
            .find({})
            .toArray();

        res.json(members);
    } catch (e) {
        console.log(e);
    }
}
