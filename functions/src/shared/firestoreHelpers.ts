import { getFirestore } from "firebase-admin/firestore";

const collections = [
  "customers",
  "products",
  "countries",
  "regions",
  "userPreferences",
];

export async function deleteOwnedDocuments(ownerId: string) {
  const db = getFirestore();
  const orderSnapshot = await db.collection("orders").where("ownerId", "==", ownerId).get();

  await Promise.all(
    orderSnapshot.docs.map(async (value) => {
      const itemsSnapshot = await value.ref.collection("items").get();
      await Promise.all(itemsSnapshot.docs.map((item) => item.ref.delete()));
      await value.ref.delete();
    }),
  );

  await Promise.all(
    collections.map(async (name) => {
      const snapshot = await db.collection(name).where("ownerId", "==", ownerId).get();
      await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
    }),
  );
}
