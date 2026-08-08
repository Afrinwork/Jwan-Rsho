import { getFirestore } from "firebase-admin/firestore";

const collections = [
  "customers",
  "orders",
  "products",
  "countries",
  "regions",
  "userPreferences",
];

export async function deleteOwnedDocuments(ownerId: string) {
  const db = getFirestore();

  await Promise.all(
    collections.map(async (name) => {
      const snapshot = await db.collection(name).where("ownerId", "==", ownerId).get();
      await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
    }),
  );
}
