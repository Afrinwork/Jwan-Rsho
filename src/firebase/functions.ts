import { getFunctions } from "firebase/functions";

import { firebaseApp } from "@/src/firebase/config";

export const functionsClient = firebaseApp ? getFunctions(firebaseApp) : null;
