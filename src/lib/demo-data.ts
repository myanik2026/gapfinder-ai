import type { QuizQuestion, StudySource } from "@/lib/types";

export const DEMO_SOURCES: StudySource[] = [
  {
    id: "demo-biology-notes",
    name: "Biology · Unit 4 notes.txt",
    text: `PHOTOSYNTHESIS
Photosynthesis converts light energy into chemical energy stored in glucose. In plants, it takes place in chloroplasts. Chlorophyll in the thylakoid membranes absorbs light. The light-dependent reactions split water, release oxygen, and produce ATP and NADPH. The Calvin cycle takes place in the stroma, where carbon dioxide is fixed into sugar using ATP and NADPH.

CELLULAR RESPIRATION
Cellular respiration releases usable energy from glucose. Glycolysis happens in the cytoplasm and does not require oxygen. When oxygen is available, the Krebs cycle and electron transport chain take place in the mitochondria. Oxygen is the final electron acceptor in the electron transport chain, and water is produced.

CELL STRUCTURE
The cell membrane is a selectively permeable boundary made mainly of a phospholipid bilayer. The nucleus stores most of a eukaryotic cell's DNA. Ribosomes build proteins. Mitochondria are the main site of aerobic cellular respiration. Plant cells also have chloroplasts and a cell wall made primarily of cellulose.

GENETICS
DNA contains genes, which are segments of DNA that provide instructions for functional products. During transcription, a gene's DNA sequence is used to make messenger RNA. During translation, a ribosome reads the messenger RNA and joins amino acids to form a protein. An allele is a version of a gene.`,
  },
  {
    id: "demo-biology-syllabus",
    name: "Biology · syllabus.txt",
    text: `Unit 4: Energy and cells
Photosynthesis
Cellular respiration
Cell structure
Genetics
Exam focus: photosynthesis and cellular respiration are high-priority topics.`,
  },
  {
    id: "demo-biology-paper",
    name: "Biology · past paper.txt",
    text: `Past paper · Unit 4
Question 1: Compare the light-dependent reactions of photosynthesis with the Calvin cycle.
Question 2: Explain the role of oxygen in the electron transport chain.
Question 3: Describe how the structure of the cell membrane allows it to be selectively permeable.
Question 4: Explain the relationship between transcription and translation.`,
  },
];

export const DEMO_QUESTIONS: QuizQuestion[] = [
  {
    id: "demo-q1",
    topic: "Photosynthesis",
    question: "Where does the Calvin cycle take place in a plant cell?",
    options: ["The cytoplasm", "The stroma", "The thylakoid membrane", "The nucleus"],
    answerIndex: 1,
    explanation:
      "The Calvin cycle takes place in the stroma. The thylakoid membranes are where chlorophyll absorbs light for the light-dependent reactions.",
    citation: {
      source: "Biology · Unit 4 notes.txt",
      excerpt:
        "The Calvin cycle takes place in the stroma, where carbon dioxide is fixed into sugar using ATP and NADPH.",
    },
  },
  {
    id: "demo-q2",
    topic: "Photosynthesis",
    question: "Which molecules from the light-dependent reactions power the Calvin cycle?",
    options: ["Oxygen and glucose", "DNA and RNA", "ATP and NADPH", "Water and carbon dioxide"],
    answerIndex: 2,
    explanation:
      "The notes state that the Calvin cycle uses ATP and NADPH to fix carbon dioxide into sugar.",
    citation: {
      source: "Biology · Unit 4 notes.txt",
      excerpt:
        "The Calvin cycle takes place in the stroma, where carbon dioxide is fixed into sugar using ATP and NADPH.",
    },
  },
  {
    id: "demo-q3",
    topic: "Cellular respiration",
    question: "Where does glycolysis happen?",
    options: ["The cytoplasm", "The mitochondria", "The nucleus", "The chloroplast"],
    answerIndex: 0,
    explanation:
      "Glycolysis happens in the cytoplasm. The notes distinguish this from the Krebs cycle and electron transport chain, which take place in mitochondria when oxygen is available.",
    citation: {
      source: "Biology · Unit 4 notes.txt",
      excerpt: "Glycolysis happens in the cytoplasm and does not require oxygen.",
    },
  },
  {
    id: "demo-q4",
    topic: "Cellular respiration",
    question: "What role does oxygen play in the electron transport chain?",
    options: [
      "It breaks glucose down during glycolysis.",
      "It is the final electron acceptor.",
      "It converts DNA into RNA.",
      "It absorbs light in the thylakoid membrane.",
    ],
    answerIndex: 1,
    explanation:
      "Oxygen is the final electron acceptor in the electron transport chain. Water is produced as a result.",
    citation: {
      source: "Biology · Unit 4 notes.txt",
      excerpt:
        "Oxygen is the final electron acceptor in the electron transport chain, and water is produced.",
    },
  },
  {
    id: "demo-q5",
    topic: "Cell Structure",
    question: "Which structure is described as the selectively permeable boundary of a cell?",
    options: ["The nucleus", "The cell membrane", "A ribosome", "The cell wall"],
    answerIndex: 1,
    explanation:
      "The cell membrane is the selectively permeable boundary. The notes describe it as being made mainly of a phospholipid bilayer.",
    citation: {
      source: "Biology · Unit 4 notes.txt",
      excerpt:
        "The cell membrane is a selectively permeable boundary made mainly of a phospholipid bilayer.",
    },
  },
  {
    id: "demo-q6",
    topic: "Cell Structure",
    question: "Which organelle builds proteins?",
    options: ["Ribosomes", "Chloroplasts", "The cell wall", "The nucleus"],
    answerIndex: 0,
    explanation:
      "Ribosomes build proteins. The nucleus stores most eukaryotic DNA, while chloroplasts are also found in plant cells.",
    citation: {
      source: "Biology · Unit 4 notes.txt",
      excerpt:
        "The nucleus stores most of a eukaryotic cell's DNA. Ribosomes build proteins.",
    },
  },
  {
    id: "demo-q7",
    topic: "Genetics",
    question: "What is made during transcription according to the notes?",
    options: ["A protein", "Messenger RNA", "Glucose", "An allele"],
    answerIndex: 1,
    explanation:
      "During transcription, a gene's DNA sequence is used to make messenger RNA. Translation then uses the messenger RNA to build a protein.",
    citation: {
      source: "Biology · Unit 4 notes.txt",
      excerpt:
        "During transcription, a gene's DNA sequence is used to make messenger RNA.",
    },
  },
  {
    id: "demo-q8",
    topic: "Genetics",
    question: "What does a ribosome do during translation?",
    options: [
      "Absorbs light for photosynthesis",
      "Splits water to release oxygen",
      "Reads messenger RNA and joins amino acids",
      "Stores most of the cell's DNA",
    ],
    answerIndex: 2,
    explanation:
      "During translation, a ribosome reads messenger RNA and joins amino acids to form a protein.",
    citation: {
      source: "Biology · Unit 4 notes.txt",
      excerpt:
        "During translation, a ribosome reads the messenger RNA and joins amino acids to form a protein.",
    },
  },
];
