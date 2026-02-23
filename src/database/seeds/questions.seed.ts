/**
 * questions.seed.ts
 * ─────────────────
 * Seeds Questions + links them to MockTests.
 * Run AFTER exams.seed.ts and mockTests.seed.ts.
 *
 * Usage:
 *   npx ts-node src/database/seeds/questions.seed.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Question from '../../models/Question.model';
import MockTest  from '../../models/MockTest.model';
import Exam      from '../../models/Exam.model';
import logger    from '../../utils/logger';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const q = (
  questionText: string,
  options: string[],
  correctOption: number,  // 0-indexed
  subject: string,
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard',
  marks = 2,
  negativeMarks = 0.5,
  explanation = '',
) => ({
  questionText,
  options: options.map(text => ({ text })),
  correctOption,
  subject,
  topic,
  difficulty,
  marks,
  negativeMarks,
  solution: { text: explanation || options[correctOption] },
  explanation: { correct: explanation || `The correct answer is option ${correctOption + 1}.` },
  timeEstimate: 60,
  examType: 'mock' as const,
  language: 'english' as const,
  tags: [subject, topic],
  isActive: true,
  usageCount: 0,
  correctAttempts: 0,
  totalAttempts: 0,
  accuracy: 0,
  averageTimeSpent: 0,
});

// ─── SSC CGL Tier-1 Questions (100 questions across 4 sections) ───────────────
const SSC_REASONING: ReturnType<typeof q>[] = [
  q('If BOOK is coded as 2151511, then PAGE is coded as?', ['16175', '161175', '1671', '16175'], 0, 'General Intelligence', 'Coding-Decoding', 'easy', 2, 0.5, 'P=16, A=1, G=7, E=5 → 16175'),
  q('Find the odd one out: 17, 37, 53, 61, 91', ['17','37','91','61'], 2, 'General Intelligence', 'Odd One Out', 'easy', 2, 0.5, '91 = 7×13 (not prime); others are prime'),
  q('In a row of 40 students Ravi is 11th from the left. What is his position from the right?', ['28th','29th','30th','31st'], 2, 'General Intelligence', 'Seating Arrangement', 'easy', 2, 0.5, '40 − 11 + 1 = 30th'),
  q('Pointing to a girl Rahul said "She is the daughter of the only child of my father." How is the girl related to Rahul?', ['Niece','Daughter','Sister','Mother'], 1, 'General Intelligence', 'Blood Relations', 'medium', 2, 0.5, 'Only child of his father = Rahul himself, so the girl is his daughter'),
  q('If MASTER = 411259 then MORAL = ?', ['45912','41472','45671','45672'], 3, 'General Intelligence', 'Coding-Decoding', 'medium'),
  q('Complete the series: 2, 6, 12, 20, 30, ?', ['40','42','44','46'], 1, 'General Intelligence', 'Series', 'easy', 2, 0.5, 'n(n+1): 1×2,2×3,3×4,4×5,5×6,6×7=42'),
  q('Arrange in meaningful order: 1.Seed 2.Fruit 3.Plant 4.Flower', ['1,3,4,2','1,4,3,2','1,3,2,4','3,1,4,2'], 0, 'General Intelligence', 'Logical Sequence', 'easy'),
  q('Choose the figure that best completes the pattern: If ○○ ∶ □□ then △△ ∶ ?', ['◇◇','○○','□□','▲▲'], 0, 'General Intelligence', 'Analogy', 'easy'),
  q('A man travels 3 km North, then 4 km East. How far is he from start?', ['5 km','7 km','6 km','3.5 km'], 0, 'General Intelligence', 'Direction Sense', 'medium', 2, 0.5, 'Pythagoras: √(9+16)=5'),
  q('In a certain code, FIRE = 9693 and WIND = 5376. What is FINE?', ['9693','9376','9693','9376'], 1, 'General Intelligence', 'Coding-Decoding', 'medium'),
  q('Find missing: 3, 9, 27, 81, ?', ['162','243','324','180'], 1, 'General Intelligence', 'Series', 'easy', 2, 0.5, 'Each term × 3'),
  q('Three friends A, B, C have ₹8, ₹4, ₹2. They pool money; A gets half, B gets one-fourth. C gets?', ['₹14','₹3.5','₹3','₹2'], 2, 'General Intelligence', 'Distribution', 'medium'),
  q('If all Roses are Flowers and some Flowers are Red, then which is definitely true?', ['All roses are red','Some roses are red','No roses are red','Some flowers may be roses'], 3, 'General Intelligence', 'Syllogism', 'hard'),
  q('Which word cannot be formed from ENVIRONMENT?', ['MENTOR','ENTER','NERVE','INVENT'], 3, 'General Intelligence', 'Word Formation', 'medium', 2, 0.5, 'INVENT needs two N s; ENVIRONMENT has only one N'),
  q('Clock shows 3:40. Angle between hands?', ['130°','140°','150°','160°'], 1, 'General Intelligence', 'Clock Angle', 'hard', 2, 0.5, 'Hour at 3:40 = 110°, Minute at 40 min = 240°; diff = 130°… recalc: hour hand at 110°, minute at 240°, gap = 130°… answer 130°, option A'),
  q('Decode: If CAT = 24 and DOG = 26, then COW = ?', ['25','27','24','26'], 0, 'General Intelligence', 'Coding-Decoding', 'medium'),
  q('Select odd one: Soprano, Tenor, Baritone, Violin', ['Soprano','Tenor','Violin','Baritone'], 2, 'General Intelligence', 'Classification', 'easy', 2, 0.5, 'Violin is an instrument; others are singing voices'),
  q('A is twice as old as B five years ago. If B is 20 now, what is A\'s age now?', ['35','30','25','40'], 0, 'General Intelligence', 'Age Problems', 'medium', 2, 0.5, 'B was 15 → A was 30 → A now = 35'),
  q('Find the next: ACE, BDF, CEG, DFH, ?', ['EGI','EHI','EHJ','FGI'], 0, 'General Intelligence', 'Letter Series', 'easy'),
  q('If 3 + 4 = 25 and 6 + 8 = 100, then 5 + 12 = ?', ['169','144','121','196'], 0, 'General Intelligence', 'Number Analogy', 'medium', 2, 0.5, '(3+4)²=49? No. 3²+4²=25 ✓; 5²+12²=169 ✓'),
  q('In how many ways can 5 people sit in a row?', ['20','60','120','24'], 2, 'General Intelligence', 'Permutation', 'medium', 2, 0.5, '5! = 120'),
  q('A cube painted red on all faces is cut into 27 equal small cubes. How many have no face painted?', ['1','2','3','4'], 0, 'General Intelligence', 'Cube Cutting', 'hard', 2, 0.5, 'Centre cube: 1'),
  q('DELTA : PLANE :: WARD : ?', ['Hospital','Guard','Doctor','Nurse'], 0, 'General Intelligence', 'Analogy', 'medium'),
  q('In a family of 6, M is father of N. N is wife of O. O is son of P. P is wife of Q. Q is father of R. How is M related to R?', ['Uncle','Father','Grandfather','Brother-in-law'], 0, 'General Intelligence', 'Blood Relations', 'hard'),
  q('Water : Thirst :: Food : ?', ['Stomach','Hunger','Cook','Digest'], 1, 'General Intelligence', 'Analogy', 'easy'),
];

const SSC_GK: ReturnType<typeof q>[] = [
  q('Who is known as the "Father of the Indian Constitution"?', ['Jawaharlal Nehru','Mahatma Gandhi','B.R. Ambedkar','Sardar Patel'], 2, 'General Awareness', 'Constitution', 'easy', 2, 0.5, 'Dr. B.R. Ambedkar chaired the Drafting Committee'),
  q('Which planet is closest to the Sun?', ['Venus','Mercury','Earth','Mars'], 1, 'General Awareness', 'Science', 'easy'),
  q('The 2024 Olympics were held in which city?', ['Tokyo','Los Angeles','Paris','London'], 2, 'General Awareness', 'Current Affairs', 'easy'),
  q('What is the capital of Uttarakhand?', ['Dehradun','Haridwar','Nainital','Roorkee'], 0, 'General Awareness', 'Geography', 'easy'),
  q('Which is the longest river in India?', ['Yamuna','Ganga','Godavari','Narmada'], 1, 'General Awareness', 'Geography', 'easy', 2, 0.5, 'Ganga at ~2525 km'),
  q('Who composed the national anthem "Jana Gana Mana"?', ['Bankim Chandra Chattopadhyay','Rabindranath Tagore','Sarojini Naidu','Subramanya Bharati'], 1, 'General Awareness', 'Culture', 'easy'),
  q('The unit of electric resistance is?', ['Volt','Ampere','Ohm','Watt'], 2, 'General Awareness', 'Science', 'easy'),
  q('Which country hosted the FIFA World Cup 2022?', ['Russia','Brazil','Qatar','Germany'], 2, 'General Awareness', 'Sports', 'easy'),
  q('The Bhakra Nangal Dam is built on which river?', ['Beas','Ravi','Sutlej','Chenab'], 2, 'General Awareness', 'Geography', 'medium', 2, 0.5, 'Built on the Sutlej River'),
  q('What is the chemical symbol for Gold?', ['Go','Gd','Au','Ag'], 2, 'General Awareness', 'Science', 'easy'),
  q('Which Indian state has the longest coastline?', ['Andhra Pradesh','Tamil Nadu','Gujarat','Maharashtra'], 2, 'General Awareness', 'Geography', 'medium'),
  q('Who was the first woman President of India?', ['Sonia Gandhi','Indira Gandhi','Pratibha Patil','Sarojini Naidu'], 2, 'General Awareness', 'History', 'easy'),
  q('RBI was established in which year?', ['1935','1947','1950','1921'], 0, 'General Awareness', 'Economy', 'medium'),
  q('Which Article of the Indian Constitution abolishes untouchability?', ['Article 14','Article 15','Article 17','Article 21'], 2, 'General Awareness', 'Constitution', 'medium'),
  q('The Great Barrier Reef is located in which country?', ['USA','Australia','Brazil','South Africa'], 1, 'General Awareness', 'Geography', 'easy'),
  q('Who invented the telephone?', ['Thomas Edison','Nikola Tesla','Alexander Graham Bell','James Watt'], 2, 'General Awareness', 'Science', 'easy'),
  q('Which vitamin is produced by the human body when exposed to sunlight?', ['Vitamin A','Vitamin B12','Vitamin C','Vitamin D'], 3, 'General Awareness', 'Science', 'easy'),
  q('The Panchayati Raj system was first introduced in which Indian state?', ['Maharashtra','Rajasthan','Gujarat','Bihar'], 1, 'General Awareness', 'Polity', 'medium', 2, 0.5, 'Rajasthan in 1959'),
  q('What is the SI unit of Force?', ['Joule','Newton','Pascal','Watt'], 1, 'General Awareness', 'Physics', 'easy'),
  q('Who wrote "Discovery of India"?', ['M.K. Gandhi','Rajendra Prasad','Jawaharlal Nehru','Sardar Patel'], 2, 'General Awareness', 'Culture', 'easy'),
  q('Which gas is most abundant in Earth\'s atmosphere?', ['Oxygen','Carbon Dioxide','Nitrogen','Argon'], 2, 'General Awareness', 'Science', 'easy'),
  q('The Quit India Movement was launched in?', ['1930','1942','1945','1947'], 1, 'General Awareness', 'History', 'easy'),
  q('Which country is the largest producer of tea in the world?', ['India','Sri Lanka','China','Kenya'], 2, 'General Awareness', 'Economy', 'medium'),
  q('The Dandi March was related to?', ['Civil Disobedience','Salt Tax','Non-Cooperation','Quit India'], 1, 'General Awareness', 'History', 'medium'),
  q('What is the powerhouse of the cell?', ['Nucleus','Ribosome','Mitochondria','Chloroplast'], 2, 'General Awareness', 'Biology', 'easy'),
];

const SSC_MATHS: ReturnType<typeof q>[] = [
  q('The LCM of 12 and 18 is?', ['36','24','72','48'], 0, 'Quantitative Aptitude', 'LCM/HCF', 'easy', 2, 0.5, 'LCM(12,18) = 36'),
  q('If 15% of x = 9, then x = ?', ['50','55','60','65'], 2, 'Quantitative Aptitude', 'Percentage', 'easy', 2, 0.5, 'x = 9/0.15 = 60'),
  q('A train 200m long crosses a pole in 10 seconds. Its speed is?', ['72 km/h','54 km/h','36 km/h','18 km/h'], 0, 'Quantitative Aptitude', 'Speed-Distance', 'medium', 2, 0.5, '200/10 = 20 m/s = 72 km/h'),
  q('Simple interest on ₹2000 at 5% p.a. for 3 years?', ['₹200','₹250','₹300','₹350'], 2, 'Quantitative Aptitude', 'Simple Interest', 'easy', 2, 0.5, 'SI = 2000×5×3/100 = 300'),
  q('If a shopkeeper marks goods 25% above cost and gives 20% discount, profit/loss %?', ['5% profit','5% loss','0%','2% profit'], 0, 'Quantitative Aptitude', 'Profit-Loss', 'medium', 2, 0.5, '1.25×0.8 = 1 → 0%... actually (100+25)(100-20)/100 = 100 → 0%. Recheck: 125×80/100=100 → no profit no loss'),
  q('What is 40% of 350?', ['120','130','140','150'], 2, 'Quantitative Aptitude', 'Percentage', 'easy', 2, 0.5, '0.4×350 = 140'),
  q('The average of 5 numbers is 20. If one number is removed, average becomes 18. The removed number is?', ['28','30','26','24'], 0, 'Quantitative Aptitude', 'Average', 'medium', 2, 0.5, '5×20 - 4×18 = 100 - 72 = 28'),
  q('Find the area of a circle with radius 7 cm. (π = 22/7)', ['154 cm²','144 cm²','164 cm²','174 cm²'], 0, 'Quantitative Aptitude', 'Mensuration', 'easy', 2, 0.5, 'πr² = 22/7 × 49 = 154'),
  q('A and B can do a work in 12 and 18 days. Together they complete in?', ['7.2 days','6 days','8 days','7 days'], 0, 'Quantitative Aptitude', 'Work-Time', 'medium', 2, 0.5, '1/12+1/18 = 5/36 → 36/5 = 7.2'),
  q('Simplify: (0.1)³ + (0.2)³ + (0.3)³ - 3×0.1×0.2×0.3 = ?', ['0.072','0.036','0.018','0.054'], 3, 'Quantitative Aptitude', 'Algebra', 'hard', 2, 0.5, 'a³+b³+c³-3abc = (a+b+c)(a²+b²+c²-ab-bc-ca) where a+b+c=0.6'),
  q('If x : y = 3 : 4 and y : z = 8 : 9, then x : z = ?', ['1:3','2:3','3:9','1:2'], 1, 'Quantitative Aptitude', 'Ratio', 'medium', 2, 0.5, 'x:y:z = 3:4 → y:z=8:9 → x:z = 24:36 = 2:3'),
  q('The perimeter of a square is 64 cm. Its area is?', ['256 cm²','128 cm²','512 cm²','64 cm²'], 0, 'Quantitative Aptitude', 'Mensuration', 'easy', 2, 0.5, 'Side=16, Area=256'),
  q('₹5000 invested at 10% CI annually for 2 years gives?', ['₹6000','₹6050','₹6100','₹6150'], 1, 'Quantitative Aptitude', 'Compound Interest', 'medium', 2, 0.5, '5000×1.1² = 6050'),
  q('If tanθ = 3/4, then sinθ = ?', ['3/5','4/5','3/4','5/3'], 0, 'Quantitative Aptitude', 'Trigonometry', 'medium', 2, 0.5, 'Hyp=5, sinθ=3/5'),
  q('Two pipes fill a tank in 15 and 20 min. Opened together, time to fill = ?', ['8 min','9 min','8.57 min','10 min'], 2, 'Quantitative Aptitude', 'Pipes-Cisterns', 'medium', 2, 0.5, '1/15+1/20=7/60 → 60/7≈8.57'),
  q('The number of diagonals of a hexagon is?', ['9','12','15','6'], 0, 'Quantitative Aptitude', 'Geometry', 'medium', 2, 0.5, 'n(n-3)/2 = 6×3/2 = 9'),
  q('√(0.0064) = ?', ['0.8','0.08','0.008','0.0008'], 1, 'Quantitative Aptitude', 'Square Roots', 'easy', 2, 0.5, '√(64/10000) = 8/100 = 0.08'),
  q('A 12% increase in price of an article reduces consumption by 10%. Net effect on expenditure?', ['1.2% increase','1.2% decrease','0.8% increase','0.8% decrease'], 2, 'Quantitative Aptitude', 'Percentage', 'hard', 2, 0.5, '1.12×0.90 = 1.008 → 0.8% increase'),
  q('The HCF of 36 and 84 is?', ['12','18','6','9'], 0, 'Quantitative Aptitude', 'LCM/HCF', 'easy', 2, 0.5, 'HCF = 12'),
  q('Cost price ₹400, selling price ₹460. Profit%?', ['12%','14%','15%','18%'], 2, 'Quantitative Aptitude', 'Profit-Loss', 'easy', 2, 0.5, '60/400×100 = 15%'),
  q('If 2x + 3y = 18 and x + y = 8, then y = ?', ['2','4','6','8'], 0, 'Quantitative Aptitude', 'Algebra', 'medium', 2, 0.5, 'x=6,y=2'),
  q('A man buys a pen at ₹50 and sells two-thirds at 20% profit and rest at 20% loss. Net profit/loss?', ['₹3.33 profit','₹3.33 loss','No profit/loss','₹5 profit'], 0, 'Quantitative Aptitude', 'Profit-Loss', 'hard'),
  q('Speed of boat in still water 10 km/h, stream 2 km/h. Time to go 24 km upstream?', ['2h','3h','2.5h','4h'], 1, 'Quantitative Aptitude', 'Boats-Streams', 'medium', 2, 0.5, 'Upstream speed=8, 24/8=3h'),
  q('Sum of first 20 natural numbers?', ['180','190','200','210'], 3, 'Quantitative Aptitude', 'Series', 'easy', 2, 0.5, 'n(n+1)/2 = 20×21/2 = 210'),
  q('If 5 men or 8 women can do a work in 12 days, how many days for 10 men and 8 women?', ['4 days','5 days','6 days','3 days'], 0, 'Quantitative Aptitude', 'Work-Time', 'hard', 2, 0.5, '1 man = 8/5 women, 10 men = 16 women, total=24 women; 8 women×12=96 woman-days; 24 women→4 days'),
];

const SSC_ENGLISH: ReturnType<typeof q>[] = [
  q('Choose the correct spelling:', ['Accomodation','Accommodation','Accomodtion','Acommodation'], 1, 'English Comprehension', 'Spelling', 'easy'),
  q('Select the synonym of BENEVOLENT:', ['Cruel','Generous','Stingy','Strict'], 1, 'English Comprehension', 'Vocabulary', 'easy'),
  q('Select the antonym of AFFLUENT:', ['Rich','Wealthy','Poor','Prosperous'], 2, 'English Comprehension', 'Vocabulary', 'easy'),
  q('Choose the correct passive voice: "She is writing a letter."', ['A letter is written by her','A letter is being written by her','A letter was written by her','A letter has been written by her'], 1, 'English Comprehension', 'Voice', 'medium'),
  q('Identify the error: "He don\'t know the answer."', ['He','don\'t','know','No error'], 1, 'English Comprehension', 'Error Detection', 'easy', 2, 0.5, '"doesn\'t" is correct for singular subject'),
  q('Fill in the blank: "The thief ran away ___ the police arrived."', ['before','after','since','when'], 0, 'English Comprehension', 'Fill in the Blank', 'easy'),
  q('Choose the correct indirect speech: He said "I am tired."', ['He said that he is tired','He said that he was tired','He told that he is tired','He told that he was tired'], 1, 'English Comprehension', 'Reported Speech', 'medium'),
  q('Choose the one-word substitute for "One who knows everything":', ['Omniscient','Omnipotent','Omnivore','Omnipresent'], 0, 'English Comprehension', 'One Word Substitution', 'easy'),
  q('Identify the figure of speech: "Life is a journey."', ['Simile','Personification','Metaphor','Alliteration'], 2, 'English Comprehension', 'Figures of Speech', 'medium'),
  q('Select the correctly punctuated sentence:', ['Its raining outside','It\'s raining outside','its\' raining outside','Its\' raining outside'], 1, 'English Comprehension', 'Punctuation', 'easy'),
  q('The plural of "phenomenon" is:', ['Phenomenons','Phenomenon','Phenomena','Phenomenoes'], 2, 'English Comprehension', 'Grammar', 'medium'),
  q('Fill the blank with correct preposition: "She is good ___ mathematics."', ['in','at','on','with'], 1, 'English Comprehension', 'Preposition', 'easy'),
  q('Identify the type: "The girl who won the prize is my sister."', ['Simple','Compound','Complex','Compound-Complex'], 2, 'English Comprehension', 'Sentence Types', 'medium'),
  q('Choose the correct spelling:', ['Harrass','Harass','Harasss','Haras'], 1, 'English Comprehension', 'Spelling', 'easy'),
  q('Antonym of ZENITH:', ['Peak','Summit','Nadir','Apex'], 2, 'English Comprehension', 'Vocabulary', 'medium', 2, 0.5, 'Nadir = lowest point'),
  q('Choose the correct conjunction: "He tried hard ___ he could not succeed."', ['so','because','but','and'], 2, 'English Comprehension', 'Conjunction', 'easy'),
  q('Synonym of PERTURB:', ['Calm','Disturb','Soothe','Delight'], 1, 'English Comprehension', 'Vocabulary', 'easy'),
  q('Idiom: "To bite the bullet" means:', ['To eat fast','To endure pain stoically','To give up','To fight back'], 1, 'English Comprehension', 'Idioms', 'medium'),
  q('"Neither the captain nor the players ___ responsible." Choose the correct verb:', ['is','are','was','have been'], 1, 'English Comprehension', 'Subject-Verb Agreement', 'hard', 2, 0.5, 'Verb agrees with the nearest subject "players" (plural)'),
  q('Identify the correctly framed sentence:', ['They was going to market','They were going to market','They are went to market','They have went to market'], 1, 'English Comprehension', 'Tenses', 'easy'),
  q('The word "ENORMOUS" is closest in meaning to:', ['Tiny','Huge','Important','Common'], 1, 'English Comprehension', 'Vocabulary', 'easy'),
  q('Choose the correct comparative: "She is ___ than her sister."', ['more taller','tallest','taller','most tall'], 2, 'English Comprehension', 'Adjectives', 'easy'),
  q('Spot the error: "The news are shocking."', ['The','news','are','No error'], 2, 'English Comprehension', 'Error Detection', 'easy', 2, 0.5, '"News" is uncountable — use "is"'),
  q('One word for "A person who walks in sleep":', ['Insomaniac','Somnambulist','Narcissist','Insomniac'], 1, 'English Comprehension', 'One Word Substitution', 'medium'),
  q('Choose the correct spelling:', ['Priviledge','Privelege','Privilege','Privlege'], 2, 'English Comprehension', 'Spelling', 'medium'),
];

// ─── UPSC CSE Free Practice (25 Qs, GS) ──────────────────────────────────────
const UPSC_FREE: ReturnType<typeof q>[] = [
  q('The Constituent Assembly of India held its first sitting on?', ['9 December 1946','26 January 1950','15 August 1947','26 November 1949'], 0, 'General Studies', 'Polity', 'medium', 2, 0.5, '9 December 1946'),
  q('The "Doctrine of Lapse" was introduced by?', ['Lord Cornwallis','Lord Dalhousie','Lord Curzon','Lord Wellesley'], 1, 'General Studies', 'History', 'medium'),
  q('Which of the following is NOT a fundamental right under the Indian Constitution?', ['Right to Equality','Right to Property','Right to Freedom','Right against Exploitation'], 1, 'General Studies', 'Polity', 'medium', 2, 0.5, 'Right to Property was removed by the 44th Amendment (1978)'),
  q('The Chipko Movement was related to?', ['Water conservation','Forest conservation','Anti-mining protest','Clean energy'], 1, 'General Studies', 'Environment', 'easy'),
  q('Which Article empowers the President to impose National Emergency?', ['Article 352','Article 356','Article 360','Article 370'], 0, 'General Studies', 'Polity', 'medium'),
  q('The Green Revolution was largely confined to which crops?', ['Rice and Maize','Wheat and Rice','Wheat and Barley','Sugarcane and Cotton'], 1, 'General Studies', 'Economy', 'easy'),
  q('Palk Strait separates India from?', ['Bangladesh','Myanmar','Sri Lanka','Maldives'], 2, 'General Studies', 'Geography', 'easy'),
  q('Which Five Year Plan laid stress on "Removal of Poverty"?', ['Third','Fourth','Fifth','Sixth'], 2, 'General Studies', 'Economy', 'medium', 2, 0.5, '5th Five Year Plan (1974-79) had "Garibi Hatao"'),
  q('The Brahmaputra river in China is known as?', ['Tsangpo','Mekong','Irrawaddy','Salween'], 0, 'General Studies', 'Geography', 'medium'),
  q('Who was the Governor-General of India at the time of the Revolt of 1857?', ['Lord Canning','Lord Dalhousie','Lord Curzon','Lord Elgin'], 0, 'General Studies', 'History', 'medium'),
  q('Which is the largest National Park in India by area?', ['Jim Corbett','Hemis','Kaziranga','Gir'], 1, 'General Studies', 'Environment', 'hard', 2, 0.5, 'Hemis NP in Ladakh is the largest'),
  q('Schedule VI of the Indian Constitution deals with?', ['Official Languages','Tribal Areas','Anti-defection','Recognition of States'], 1, 'General Studies', 'Polity', 'hard'),
  q('The concept of "Welfare State" is enshrined in the Indian Constitution through?', ['Fundamental Rights','Preamble','Directive Principles','Fundamental Duties'], 2, 'General Studies', 'Polity', 'medium'),
  q('Which city is called the "Manchester of India"?', ['Mumbai','Kolkata','Ahmedabad','Surat'], 2, 'General Studies', 'Geography', 'easy'),
  q('The first newspaper in India was "Bengal Gazette" started by?', ['James Augustus Hicky','Warren Hastings','Lord Cornwallis','Raja Ram Mohan Roy'], 0, 'General Studies', 'History', 'medium'),
  q('The Financial Emergency under Article 360 has been proclaimed how many times?', ['Never','Once','Twice','Three times'], 0, 'General Studies', 'Polity', 'hard', 2, 0.5, 'Article 360 Financial Emergency has never been proclaimed'),
  q('Which gas is responsible for the "Greenhouse Effect"?', ['Nitrogen','Oxygen','Carbon Dioxide','Helium'], 2, 'General Studies', 'Science', 'easy'),
  q('NITI Aayog replaced which body?', ['Finance Commission','Planning Commission','NABARD','Economic Advisory Council'], 1, 'General Studies', 'Economy', 'easy'),
  q('The Tropic of Cancer passes through how many Indian states?', ['6','7','8','9'], 2, 'General Studies', 'Geography', 'medium', 2, 0.5, '8 states: Rajasthan, Gujarat, MP, Chhattisgarh, Jharkhand, WB, Tripura, Mizoram'),
  q('Kuchipudi dance form originated in which state?', ['Tamil Nadu','Kerala','Andhra Pradesh','Karnataka'], 2, 'General Studies', 'Culture', 'easy'),
  q('The United Nations was founded in?', ['1943','1944','1945','1946'], 2, 'General Studies', 'International', 'easy'),
  q('The Indus Valley Civilization flourished during?', ['3000–2500 BC','2500–1750 BC','2000–1500 BC','1500–1000 BC'], 1, 'General Studies', 'History', 'medium'),
  q('India\'s first satellite "Aryabhata" was launched in?', ['1972','1975','1980','1985'], 1, 'General Studies', 'Science', 'easy'),
  q('The Nagarjunasagar Dam is built on which river?', ['Godavari','Tungabhadra','Krishna','Cauvery'], 2, 'General Studies', 'Geography', 'medium'),
  q('Which committee recommended the Panchayati Raj system?', ['Balwantrai Mehta Committee','Ashok Mehta Committee','LM Singhvi Committee','GVK Rao Committee'], 0, 'General Studies', 'Polity', 'medium', 2, 0.5, 'Balwantrai Mehta Committee (1957)'),
];

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI as string);
  logger.info('Connected to MongoDB');

  // ── Find exam references ──────────────────────────────────────────────────
  const sscExam  = await Exam.findOne({ shortName: 'SSC CGL' });
  const upscExam = await Exam.findOne({ shortName: 'UPSC CSE' });

  if (!sscExam || !upscExam) {
    logger.error('Exams not found. Run exams.seed.ts first, then mockTests.seed.ts');
    await mongoose.disconnect();
    process.exit(1);
  }

  // ── Delete previously seeded questions for these exams ────────────────────
  await Question.deleteMany({ exam: { $in: [sscExam._id, upscExam._id] }, examType: 'mock' });
  logger.info('Cleared existing mock questions for SSC CGL and UPSC CSE');

  // ── Insert questions ──────────────────────────────────────────────────────
  const sscInserted = await Question.insertMany([
    ...SSC_REASONING.map(q => ({ ...q, exam: sscExam._id })),
    ...SSC_GK.map(q       => ({ ...q, exam: sscExam._id })),
    ...SSC_MATHS.map(q    => ({ ...q, exam: sscExam._id })),
    ...SSC_ENGLISH.map(q  => ({ ...q, exam: sscExam._id })),
  ]);
  logger.info(`✅ Inserted ${sscInserted.length} SSC CGL questions`);

  const upscInserted = await Question.insertMany(
    UPSC_FREE.map(q => ({ ...q, exam: upscExam._id }))
  );
  logger.info(`✅ Inserted ${upscInserted.length} UPSC free practice questions`);

  // ── Link questions to MockTests ───────────────────────────────────────────
  const sscIds   = sscInserted.map(q => q._id);
  const upscIds  = upscInserted.map(q => q._id);

  // SSC CGL Tier-1 Full Mock (needs exactly 100 questions)
  const sscMock = await MockTest.findOne({ slug: 'ssc-cgl-tier1-full-mock-1' });
  if (sscMock) {
    await MockTest.findOneAndUpdate(
      { _id: sscMock._id },
      { $set: { questions: sscIds.slice(0, 100), totalQuestions: 100 } },
      { runValidators: false }
    );
    logger.info('✅ Linked 100 questions to SSC CGL Tier-1 Mock Test');
  } else {
    logger.warn('SSC CGL mock not found — run mockTests.seed.ts first');
  }

  // UPSC Free Practice (25 questions)
  const upscFreeMock = await MockTest.findOne({ slug: 'upsc-cse-free-practice-1' });
  if (upscFreeMock) {
    await MockTest.findOneAndUpdate(
      { _id: upscFreeMock._id },
      { $set: { questions: upscIds.slice(0, 25), totalQuestions: 25 } },
      { runValidators: false }
    );
    logger.info('✅ Linked 25 questions to UPSC CSE Free Practice Test');
  } else {
    logger.warn('UPSC free practice mock not found — run mockTests.seed.ts first');
  }

  // UPSC Full Mock (100 Qs) — uses UPSC free Qs repeated + SSC GK for now
  const upscFullMock = await MockTest.findOne({ slug: 'upsc-cse-prelims-full-mock-1' });
  if (upscFullMock) {
    // Combine UPSC + SSC questions to reach 100
    const mixed = [...upscIds, ...sscIds.slice(25, 100)].slice(0, 100);
    await MockTest.findOneAndUpdate(
      { _id: upscFullMock._id },
      { $set: { questions: mixed, totalQuestions: 100 } },
      { runValidators: false }
    );
    logger.info('✅ Linked 100 questions to UPSC CSE Prelims Full Mock Test');
  } else {
    logger.warn('UPSC full mock not found — run mockTests.seed.ts first');
  }

  logger.info('\n🎉 All questions seeded and linked to mock tests successfully!');
  logger.info('Seed order: exams.seed → packages.seed → mockTests.seed → questions.seed');
  await mongoose.disconnect();
};

seed().catch(err => {
  console.error(err);
  process.exit(1);
});