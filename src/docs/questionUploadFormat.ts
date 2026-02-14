/**
 * ============================================================
 * QUESTION BULK UPLOAD — FORMAT REFERENCE
 * ============================================================
 *
 * POST /api/v1/admin/questions/bulk
 * Headers: Authorization: Bearer <admin_token>
 * Body: JSON
 *
 * Max 500 questions per request.
 * ============================================================
 */

export const BULK_UPLOAD_SAMPLE = {
  examId: "<MongoDB ObjectId of the exam>",
  questions: [
    {
      // ── Required ─────────────────────────────────────────
      questionText: "The Battle of Plassey was fought in which year?",
      options: [
        { text: "1757", image: null },
        { text: "1764", image: null },
        { text: "1857", image: null },
        { text: "1600", image: null }
      ],
      correctOption: 0,       // 0-indexed: 0=A, 1=B, 2=C, 3=D
      subject: "History",
      
      // ── Recommended ──────────────────────────────────────
      topic: "Modern India",
      subTopic: "British Conquest",
      difficulty: "easy",     // "easy" | "medium" | "hard"
      marks: 2,
      negativeMarks: 0.5,
      timeEstimate: 30,       // seconds
      year: 2023,             // PYQ year (omit for mock)
      examType: "pyq",        // "pyq" | "mock" | "practice"
      language: "english",    // "english" | "hindi" | "both"
      tags: ["history", "battle", "british"],

      // ── Solution (shown after test) ───────────────────────
      solution: {
        text: "The Battle of Plassey was fought on June 23, 1757 between the Nawab of Bengal Siraj ud-Daulah and the British East India Company led by Robert Clive.",
        steps: [
          "Identify the key event: Battle of Plassey",
          "Recall the year: 1757",
          "Context: Robert Clive vs Siraj ud-Daulah"
        ],
        relatedConcepts: ["East India Company", "Robert Clive", "Bengal Nawabs"]
      }
    },

    // ── Example with image question ───────────────────────
    {
      questionText: "In the figure below, the value of x is:",
      questionImage: "https://cdn.pyqpb.com/questions/q123.png",
      options: [
        { text: "30°",  image: null },
        { text: "45°",  image: null },
        { text: "60°",  image: null },
        { text: "90°",  image: null }
      ],
      correctOption: 2,
      subject: "Mathematics",
      topic: "Geometry",
      difficulty: "medium",
      marks: 2,
      negativeMarks: 0.5,
      timeEstimate: 90,
      examType: "mock",
      solution: {
        text: "Using the exterior angle theorem, x = 60°",
        formula: "Exterior angle = sum of two non-adjacent interior angles"
      }
    }
  ]
};

/**
 * ─── FIELD REFERENCE ───────────────────────────────────────
 *
 * REQUIRED fields:
 *   questionText    string     The question
 *   options         array      2–6 items: { text: string, image?: string }
 *   correctOption   number     0-indexed position of correct answer
 *   subject         string     e.g. "History", "Mathematics", "English"
 *
 * OPTIONAL (have defaults):
 *   questionImage   string     URL to question image (default: null)
 *   topic           string     Subtopic (default: "General")
 *   subTopic        string     Further breakdown (default: "")
 *   difficulty      string     "easy"|"medium"|"hard" (default: "medium")
 *   marks           number     Per-question marks (default: 1)
 *   negativeMarks   number     Marks deducted for wrong answer (default: 0.25)
 *   timeEstimate    number     Expected seconds to answer (default: 60)
 *   year            number     PYQ year, e.g. 2023 (default: null)
 *   examType        string     "pyq"|"mock"|"practice" (default: "pyq")
 *   language        string     "english"|"hindi"|"both" (default: "english")
 *   tags            string[]   Search tags (default: [])
 *   solution        object     { text, steps[], formula, relatedConcepts[] }
 *
 * ─── VALIDATION RULES ──────────────────────────────────────
 *
 *   - options: minimum 2, maximum 6
 *   - correctOption: 0 to (options.length - 1)
 *   - marks: minimum 0.25
 *   - year: 2000 to current year
 *   - difficulty: must be "easy", "medium", or "hard"
 *   - Max 500 questions per upload request
 *
 * ─── ERROR HANDLING ────────────────────────────────────────
 *
 *   The bulk upload uses { ordered: false } so partial uploads succeed.
 *   Invalid questions are skipped; valid ones are inserted.
 *   Response includes: { uploaded, total, examId, exam }
 */