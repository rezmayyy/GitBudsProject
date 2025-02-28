import { db } from './Firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Stop words (common words to exclude from search tokens)
const stopWords = new Set([
  "the", "is", "and", "to", "a", "of", "in", "that", "it", "on", "for", "with",
  "as", "was", "at", "by", "an", "be", "this", "which", "or", "from", "but",
  "not", "are", "were", "can", "will", "has", "had", "have"
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
  const postKeywords = (post.keywords || []).map(keyword => keyword.toLowerCase());

  tokens.forEach(token => {
    if (postKeywords.includes(token)) {
      score++;
    }
  });

  return score;
}

/**
 * Searches for posts based on a search string and sorts them by relevance.
 * If multiple posts have the same score, a secondary sort is applied based on the sortType:
 * - "date"   → Sort by most recent update (timestamp)
 * - "rating" → Sort by most likes (likes.length)
 * - "views"  → Sort by most views (views)
 *
 * @param {string} searchString - The search query.
 * @param {string} sortType - The secondary sorting method ("date", "rating", "views").
 * @returns {Promise<Array>} A promise that resolves to a sorted array of post objects.
 */
export async function searchPostsByKeywords(searchString, sortType = "date") {
  try {
    if (!searchString) return [];

    // Tokenize search string: lowercase, split on whitespace, remove stopwords
    const tokens = searchString
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .filter(token => !stopWords.has(token));

    if (tokens.length === 0) return [];

    // Reference to the "content-posts" collection
    const postsRef = collection(db, "content-posts");

    // Build the Firestore query
    const q = query(postsRef, where("keywords", "array-contains-any", tokens));
    const querySnapshot = await getDocs(q);

    const posts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Compute relevance score
    const scoredPosts = posts.map(post => ({
      ...post,
      score: computeKeywordScore(post, tokens),
    })).filter(post => post.score > 0);

    // Sort posts by score (descending), then apply secondary sorting
    scoredPosts.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      // Secondary sorting logic
      switch (sortType) {
        case "rating": // Sort by most likes (likes array length)
          return ((b.likes?.length || 0) - (a.likes?.length || 0));

        case "views": // Sort by most views
          return ((b.views || 0) - (a.views || 0));

        case "date": // Sort by most recent timestamp
        default:
          return ((b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0));
      }
    });

    return scoredPosts;
  } catch (error) {
    console.error("Error searching posts by keywords:", error);
    return [];
  }
}
