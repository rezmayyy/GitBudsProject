// searchalg.jsx
import { db } from './Firebase'; // Adjust the path as needed.
import { collection, query, where, getDocs } from 'firebase/firestore';

/**
 * An extensive set of common stop words (filler words) that should be excluded from the search tokens.
 */
const stopWords = new Set([
  "the", "is", "and", "to", "a", "of", "in", "that", "it", "on", "for", "with", "as", "was", "at", "by",
  "an", "be", "this", "which", "or", "from", "but", "not", "are", "were", "can", "will", "has", "had", "have"
]);
/**
 * Computes a relevance score for a given post based on how many search tokens
 * exist in its "keywords" array field.
 *
 * @param {Object} post - The post object containing a "keywords" array.
 * @param {Array} tokens - An array of lowercase search tokens.
 * @returns {number} The computed score, where each matching token adds one point.
 */
function computeKeywordScore(post, tokens) {
  let score = 0;
  // Normalize keywords to lowercase.
  const postKeywords = (post.keywords || []).map(keyword => keyword.toLowerCase());
  tokens.forEach(token => {
    if (postKeywords.includes(token)) {
      score++;
    }
  });
  return score;
}

/**
 * Searches for posts based on a search string.
 * The query uses Firestore's "array-contains-any" operator to pull only posts where
 * the "keywords" array contains any of the search tokens.
 * Posts are scored and then sorted by score (descending) and date (most recent first).
 *
 * @param {string} searchString - The search query.
 * @returns {Promise<Array>} A promise that resolves to a sorted array of post objects.
 */
export async function searchPostsByKeywords(searchString) {
  try {
    // Guard clause: If searchString is falsy, return an empty array.
    if (!searchString) return [];

    // Tokenize the search string: lowercase, split on whitespace, remove empty tokens and stopwords.
    const tokens = searchString
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .filter(token => !stopWords.has(token));

    if (tokens.length === 0) return [];

    // Reference to the "content-posts" collection.
    const postsRef = collection(db, "content-posts");

    // Build the query to pull only posts whose "keywords" array contains any of the tokens.
    const q = query(postsRef, where("keywords", "array-contains-any", tokens));
    const querySnapshot = await getDocs(q);
    const posts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Compute relevance score for each post.
    const scoredPosts = posts.map(post => ({
      ...post,
      score: computeKeywordScore(post, tokens)
    })).filter(post => post.score > 0);

    // Sort posts by score (descending) and then by date (most recent first).
    scoredPosts.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });

    return scoredPosts;
  } catch (error) {
    console.error("Error searching posts by keywords:", error);
    return [];
  }
}
