// searchalg.jsx
import { db } from './Firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Stop words (common words to exclude from search tokens)
const stopWords = new Set([
  "the", "is", "and", "to", "a", "of", "in", "that", "it", "on", "for", "with",
  "as", "was", "at", "by", "an", "be", "this", "which", "or", "from", "but",
  "not", "are", "were", "can", "will", "has", "had", "have"
]);

function computeKeywordScore(post, tokens) {
  let score = 0;
  const postKeywords = (post.keywords || []).map(k => k.toLowerCase());
  tokens.forEach(token => {
    if (postKeywords.includes(token)) score++;
  });
  return score;
}

/**
 * Searches for approved posts based on a search string and sorts them.
 * @param {string} searchString 
 * @param {string} sortType  "date"|"rating"|"views"
 * @returns {Promise<Array>}
 */
export async function searchPostsByKeywords(searchString, sortType = "date") {
  // early exit
  if (!searchString.trim()) return [];

  // tokenize + remove stop words
  const tokens = searchString
    .toLowerCase()
    .split(/\s+/)
    .filter(t => t && !stopWords.has(t));

  // build base query: only approved posts
  const postsRef = collection(db, "content-posts");
  const clauses = [
    where("status", "==", "approved")
  ];

  // if user is searching keywords, add that clause
  if (tokens.length) {
    clauses.push(where("keywords", "array-contains-any", tokens));
  }

  const q = query(postsRef, ...clauses);
  const snapshot = await getDocs(q);
  let posts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

  // score & filter by relevance only if tokens used
  if (tokens.length) {
    posts = posts
      .map(p => ({ ...p, score: computeKeywordScore(p, tokens) }))
      .filter(p => p.score > 0);
  }

  // sort by score first, then by secondary key
  posts.sort((a, b) => {
    const scoreDiff = (b.score || 0) - (a.score || 0);
    if (scoreDiff) return scoreDiff;

    switch (sortType) {
      case "rating":
        return (b.likesCount || 0) - (a.likesCount || 0);
      case "views":
        return (b.views || 0) - (a.views || 0);
      case "date":
      default:
        return (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0);
    }
  });

  return posts;
}
