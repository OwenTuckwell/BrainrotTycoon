import { collection, doc, setDoc, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db, ensureAuth } from "../firebase";
import BigNumber from "bignumber.js";

const COLLECTION = "leaderboard";

export async function submitScore(username, totalEarned) {
  try {
    const user = await ensureAuth();
    const ref = doc(db, COLLECTION, user.uid);
    await setDoc(ref, {
      username: username || "Anonymous Sigma",
      score: totalEarned,
      // store as string since Firestore can't handle BigNumber
      scoreDisplay: totalEarned,
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (e) {
    console.warn("Leaderboard submit failed:", e);
  }
}

export async function fetchLeaderboard() {
  try {
    const q = query(
      collection(db, COLLECTION),
      orderBy("updatedAt", "desc"),
      limit(100)
    );
    const snap = await getDocs(q);
    const entries = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Sort by score as BigNumber
    entries.sort((a, b) => {
      const diff = new BigNumber(b.score || 0).minus(new BigNumber(a.score || 0));
      return diff.gt(0) ? 1 : diff.lt(0) ? -1 : 0;
    });

    return entries.slice(0, 50);
  } catch (e) {
    console.warn("Leaderboard fetch failed:", e);
    return [];
  }
}
