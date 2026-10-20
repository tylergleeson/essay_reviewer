import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Model Common App Personal Statement Essays
// Common App Prompt: "The lessons we take from obstacles we encounter can be fundamental to later success.
// Recount a time when you faced a challenge, setback, or failure. How did it affect you, and what did you learn from the experience?"

const ESSAY_EXCELLENT_ROBOTICS = `The servos whined in protest as our robot lurched forward, then stopped dead. Two minutes until competition start. Around me, teams made final adjustments to polished machines while ours sat motionless on the practice field. As team captain, I felt the weight of eighteen months of work—and my leadership—hanging in the balance.

I'd joined my school's robotics team as a sophomore, drawn by the promise of building something real. But I quickly discovered that our team's greatest challenge wasn't engineering—it was each other. We were twelve students with twelve different visions, and our meetings often devolved into arguments about design philosophy while our robot remained unbuilt.

After we placed last in our first competition, I realized that technical skills alone wouldn't save us. I needed to learn how to lead, not just build. I started studying team dynamics, reading about collaborative design processes, and observing how successful teams operated at competitions. I learned that the best leaders don't just delegate—they create systems that help people work together.

I implemented structured brainstorming sessions where every idea was prototyped, not debated. I created sub-teams with clear ownership: drive train, manipulator, autonomous code. Most importantly, I learned to ask questions instead of giving answers. When our mechanical lead insisted on a complex arm design, instead of arguing for my simpler version, I asked, "What problem does this solve that the basic design doesn't?" The ensuing discussion led us to a hybrid approach better than either original.

The broken servo at our second competition was actually a blessing. As I knelt beside our robot, I wasn't alone. Our electrical specialist was already tracing the wiring while our programmer adjusted the code to compensate. We'd become a team that solved problems together. We fixed it with ninety seconds to spare and placed seventh—our best finish ever.

I now understand that leadership isn't about having the right answers. It's about asking the right questions, building systems that empower others, and creating an environment where diverse perspectives strengthen rather than fracture a team. These lessons extend far beyond robotics. In student government, I've applied the same collaborative approach to organize our school's first mental health awareness week. In my summer research internship, I used these principles to help coordinate between three different lab groups.

Our robotics team won't win worlds this year. But we've built something more valuable than a trophy-winning robot: we've learned how to transform a collection of individuals into a cohesive team. And I've learned that the obstacles that seem most insurmountable—the human ones—often teach us the most important lessons.`

const ESSAY_GOOD_PIANO = `I quit piano after ten years. My teacher, Mrs. Liu, didn't seem surprised when I told her. "You've been quitting in your heart for months," she said. She was right. What started as passionate practice sessions had become mechanical repetition. I'd check my phone during scales, rush through pieces I'd once loved. I'd fallen out of love with music, and I didn't know why.

Walking home that day, I felt relief mixed with unexpected loss. Piano had defined me since I was seven. I was "the piano girl" at school. I'd won competitions, performed at nursing homes, taught younger students. Who was I without it?

The silence at home was strange. For the first time in a decade, I had free time after school. I started joining my friends at their activities—sitting in on debate practice, helping with the spring musical's set design, attending a few robotics meetings. I was exploring, but nothing clicked. Everything felt like I was auditioning for a new identity rather than discovering who I actually was.

Then I visited my grandmother and found her old record player. On a whim, I started listening to her collection: Miles Davis, Billie Holiday, Duke Ellington—jazz I'd only known existed in theory. As I listened to Davis's "Kind of Blue," something shifted. This wasn't the rigid classical structure I'd grown tired of. This was conversation, improvisation, freedom within form.

I started teaching myself jazz piano through YouTube videos and library books. Without the pressure of competitions or my teacher's expectations, I could experiment. I learned that jazz wasn't just about technical perfection—it was about expression, about responding in the moment, about making mistakes and incorporating them into something new.

But more importantly, I learned something about myself. I hadn't fallen out of love with music—I'd fallen out of love with the way I was approaching it. I'd been so focused on external validation (competitions, teacher approval, performance perfection) that I'd forgotten why I started playing: because creating music brought me joy.

I eventually returned to Mrs. Liu, not as a classical piano student but to ask her advice about jazz. She introduced me to a local jazz pianist who now mentors me. I still practice scales, but now I understand they're tools for expression, not ends in themselves.

This experience taught me the difference between quitting and redirecting. Sometimes what feels like failure—walking away from a ten-year commitment—is actually the first step toward discovering what you really want. I learned to distinguish between the activity itself and the approach to it, between external validation and internal motivation.

I'm still "the piano girl," but now on my own terms.`

const ESSAY_NEEDS_WORK_SOCCER = `I have played soccer since I was five years old. I loved being on the team and playing with my friends. Soccer taught me many important lessons about teamwork, dedication, and hard work. However, my junior year I faced a major setback that changed my perspective on the sport and on life.

During the first game of the season, I injured my knee. It was a ACL tear and I needed surgery. I was devastated because I had worked so hard to make varsity and now I couldn't play for the whole season. I had to sit on the bench and watch my teammates play while I couldn't do anything.

At first, I was really depressed and angry. I felt like it wasn't fair that this happened to me. I had always been healthy and never had a major injury before. Why did this have to happen during such an important year? I felt sorry for myself for a long time.

But eventually I realized that I needed to change my attitude. My coach talked to me and said that I could still help the team even if I wasn't playing. He asked me to help coach the junior varsity team and work with younger players on their skills. At first I didn't want to do it because I just wanted to play myself, but I decided to try it.

Working with the younger players was actually really fun. I enjoyed teaching them the skills that I had learned over the years. I realized that I had a lot of knowledge about soccer that I could share with others. The JV players improved a lot over the season and I felt proud that I had helped them.

Through this experience, I learned that when bad things happen, you have to make the best of the situation. I learned that there are different ways to contribute to a team, not just by playing. I also learned patience because recovery took a long time and I had to work hard in physical therapy.

Now I am back playing soccer and I appreciate it more than before. I don't take for granted being able to play. I also continued to help coach the JV team even though I'm playing again. This injury taught me important lessons about resilience and finding new ways to contribute when your original plan doesn't work out.

Soccer will always be an important part of my life and this setback made me stronger and more mature. I know that I can overcome obstacles and find new opportunities even in difficult situations.`

const ESSAY_DEVELOPING_COOKING = `The smoke alarm's shrill cry echoed through our apartment for the third time that week. My mother rushed in, threw open the windows, and stared at the charred remnants of what was supposed to be stir-fried vegetables. "Mija," she sighed, "maybe cooking isn't your thing."

But it had to be my thing. After my mother's diabetes diagnosis, her doctor had been clear: she needed to change her diet drastically. No more of the traditional dishes she'd grown up making, the ones that connected her to her childhood in Mexico. Someone had to learn to cook healthier versions of the foods she loved, and as the oldest child, that someone was me.

The problem was, I'd never cooked anything more complicated than ramen. My mother had always insisted on cooking for the family herself—it was her way of showing love. Now, I stood in the kitchen with a pile of unfamiliar vegetables and a cookbook written in English (my mother's English was limited, another barrier).

I started by trying to recreate her recipes from memory, substituting ingredients as the doctor recommended. Brown rice instead of white. Olive oil instead of lard. Chicken breast instead of pork. But my versions tasted wrong—bland, textureless, nothing like the vibrant flavors I remembered. My little brother refused to eat them. My mother smiled politely and pushed food around her plate.

After two weeks of failures, I changed my approach. Instead of trying to recreate my mother's cooking, I started asking her to sit with me in the kitchen. She couldn't stand for long periods anymore, so she'd direct me from a chair. "The oil needs to shimmer first." "You're cutting those onions too large." "Taste as you go—cooking is about adjustment."

Slowly, I learned not just recipes, but technique. How to build flavor in layers. Why timing matters. When to trust my instincts versus follow instructions. I discovered that cooking wasn't about perfection—it was about understanding ingredients and how they work together.

But I also learned something unexpected: the kitchen became our space for conversation. As I chopped vegetables, my mother told me stories about learning to cook from her own mother, about the significance of certain dishes, about how food carries memory and culture. We talked about her diagnosis, her fears, her adjustment to this new reality. The kitchen, once her solo domain, became a place where we collaborated.

Six months in, I still burn things occasionally. But I've successfully adapted many of her recipes, and I've started creating new ones—fusion dishes that honor our heritage while meeting her health needs. My brother actually requests my calabacitas now. My mother has said that some of my versions are even better than her originals (though I suspect she's being generous).

This experience taught me that necessity can be the greatest teacher. It also showed me that helping someone you love sometimes means taking on challenges you never imagined for yourself. I developed patience with failure, persistence through frustration, and the ability to ask for help and guidance.

But most importantly, I learned that caregiving isn't just about practical tasks—it's about maintaining connection and dignity. By learning to cook, I didn't just help my mother manage her health. I helped preserve the cultural traditions that matter to her, and I created a new way for us to bond.`

// Supplemental Essays

// "Why Stanford?" Essay (250 words)
const ESSAY_WHY_STANFORD = `I discovered Stanford's impact during my summer research internship at a biotech startup. My mentor, a Stanford PhD, described her experience in the Bioengineering department not as traditional coursework but as "organized chaos where failure is prototyped." That phrase stuck with me.

I need that chaos. My high school's biology curriculum is linear: memorize, test, repeat. But real scientific problems aren't linear. When I tried to develop a low-cost water filtration system for my community, I failed seven times before creating a working prototype. Each failure taught me something textbooks couldn't: that innovation requires iteration, collaboration, and comfort with ambiguity.

Stanford's BioX program embodies this philosophy. The intersection of biology, engineering, and medicine isn't just interdisciplinary—it's anti-disciplinary. I want to take Bioengineering 101 with CS students, pre-meds, and future policy makers. I want to work in Professor Sarah Heilshorn's lab, where biomaterials research could help me develop accessible medical technologies for under-resourced communities like mine.

But I'm equally drawn to Stanford's culture beyond academics. I want to join Students for Sustainable Stanford and apply engineering thinking to environmental challenges. I want to participate in Cardinal Nights and discover that my future collaborators might be artists, activists, or entrepreneurs who see problems from completely different angles.

Stanford doesn't just encourage you to follow your passion—it gives you the tools, community, and permission to redefine what's possible. That's exactly the environment where I'll thrive.`

// "Why MIT?" Essay (250 words)
const ESSAY_WHY_MIT = `I fell in love with MIT through a YouTube video of students building a functional roller coaster in East Campus dormitory. Not because I want to build roller coasters, but because it perfectly captured MIT's culture: technically ambitious, slightly absurd, and fundamentally collaborative.

I'm drawn to MIT's Course 6-3 (Computer Science) because it balances theoretical depth with practical application. I don't just want to learn algorithms—I want to understand why certain approaches work and build systems that solve real problems. The UROP program would let me do both, potentially working on projects like computational biology or accessible technology while still a freshman.

What excites me most is MIT's maker culture. In high school, I taught myself to code by building a Discord bot that helps students find study groups. But I've hit the limits of what I can learn alone. At MIT, I'd join HackMIT and collaborate with people whose skills complement mine. I'd take 6.08 (Embedded Systems) and finally understand hardware-software integration. I'd participate in web.lab and learn from peers who see problems differently than I do.

Beyond academics, I'm excited about pika, the arts-focused living community. As someone who codes and plays cello, I've always resisted the false choice between technical and creative pursuits. MIT's recognition that the best problem-solvers often come from unexpected intersections resonates deeply.

MIT's motto is "Mens et Manus"—mind and hand. That integration of thinking and making, theory and practice, individual brilliance and collaborative building is exactly what I'm looking for.`

// Extracurricular Activity Essay
const ESSAY_DEBATE_ACTIVITY = `"You're too quiet," my debate partner whispered before our first tournament. She was right. I'd joined debate to overcome my fear of public speaking, but six weeks in, I still froze during cross-examination.

That first tournament was brutal. I stammered through responses while my opponents demolished our arguments. We lost every round. But something shifted during our last debate. When an opponent made a factually incorrect claim about climate policy, I forgot to be nervous. I was just angry enough to respond clearly, citing the study he'd misrepresented.

We still lost that round. But I realized my fear wasn't about public speaking—it was about being unprepared. I couldn't control my nervousness, but I could control my research.

I transformed my approach. I spent hours researching not just our positions but opposing arguments. I practiced responses until they became reflexive. I watched recordings of successful debaters and analyzed their techniques. Slowly, preparation replaced anxiety.

By junior year, I'd become the team's research captain. I created a shared database of evidence and arguments that helped novices prepare faster. I started coaching younger debaters, teaching them the research strategies that had helped me.

But my biggest growth came from learning to listen under pressure. Debate taught me that persuasion isn't about speaking louder—it's about understanding your opponent's position well enough to find common ground or expose logical flaws. That skill has helped me mediate conflicts in student government, collaborate on group projects, and engage with perspectives different from my own.

Debate didn't cure my introversion. But it taught me that thoughtful preparation and active listening are just as powerful as natural charisma.`

// Diversity Essay
const ESSAY_FIRST_GEN_DIVERSITY = `I learned I was "first-generation" during junior year college planning. My counselor used the term casually, as if I'd always known. But my parents never framed our experience that way. They simply worked—my father at a construction site, my mother cleaning houses—and expected me to study.

Being first-generation means navigating two worlds with different languages and rules. At home, I translate mail, explain school policies, and help my parents understand tax forms. At school, I translate my family's experiences into contexts my peers can understand. When classmates complain about their parents' pressure to attend prestigious universities, I stay quiet about my parents' confusion over why college applications cost money.

It also means being a bridge. When my school announced a new financial aid information night, only three Latino families attended despite our district being 40% Latino. I realized the flyers were only in English and sent home during work hours. I worked with administrators to translate materials, hold sessions on weekends, and recruit bilingual student volunteers to help families navigate the process. Attendance tripled.

This experience showed me that barriers aren't always intentional—they're often the result of systems designed by people who don't see what they're missing. As a first-generation student, I see those gaps because I live them daily.

I bring this perspective to everything I do. In my computer science class, I consider accessibility and user interface design for non-native English speakers. In student government, I advocate for policies that account for students with work or family obligations.

I don't view being first-generation as a disadvantage to overcome. It's a lens that helps me identify problems others might miss and create solutions that work for more people. That's the perspective I'll bring to college and beyond.`

// Short "What Matters to You" Essay (150 words)
const ESSAY_WHAT_MATTERS = `Precision matters to me, but not perfection. As a cellist, I've learned the difference: precision is intentional, perfection is impossible.

When I play Bach's Cello Suites, precision means understanding exactly what effect I want to create—where to place vibrato, how to shape a phrase, when to let silence speak. But pursuing perfection would mean playing it the same way every time, afraid to take risks.

This distinction extends beyond music. In my coding projects, I write precise, intentional code, but I'm not afraid to refactor when I discover better approaches. In my friendships, I try to communicate precisely what I mean, but I forgive imperfection—mine and others'.

I've watched classmates paralyze themselves chasing perfection: the unsubmitted essay, the unstarted project, the unasked question. Meanwhile, I'm learning that precision with flexibility—knowing exactly what you're trying to achieve while staying open to unexpected paths—is what actually creates growth.`

// "Community You Belong To" Essay (300 words)
const ESSAY_COMMUNITY_ROBOTICS = `Every Tuesday night, the engineering lab transforms into organized chaos. Sparks fly from welding stations. The 3D printers hum steadily. Someone's always debugging code while another team tests the drive train. This is my robotics team, and it's where I learned that community isn't just about shared interests—it's about shared struggle.

We're not a traditional team. We have theater kids who handle pneumatics, math competitors who write autonomous code, and quiet freshmen who turn out to be welding prodigies. What unites us isn't pre-existing skill—most of us knew nothing about robotics when we joined—but a willingness to fail publicly and learn collectively.

I joined sophomore year knowing nothing about engineering. I was intimidated by the technical jargon and the confident seniors who seemed to understand everything. But I quickly learned that everyone had been a beginner once, and the team's culture was built on teaching, not gatekeeping.

My mentor, a senior named Priya, spent hours teaching me CAD software. When I accidentally deleted an entire assembly file, she didn't get angry—she taught me about version control. When our robot failed at competition, we didn't blame individuals; we analyzed what went wrong and iterated together.

By junior year, I became a mentor myself. I taught freshmen the same patience Priya had shown me. I learned that strong communities reproduce themselves—not just in technical skills, but in values and culture.

What I love most about this community is that it's temporary by nature. Every year, seniors graduate and new students join. The robot we build this year will be obsolete next year. But the culture of collaborative learning, mutual support, and finding joy in shared problem-solving—that persists.

That's the kind of community I want to build and belong to in college: one that values teaching as much as learning, process as much as outcomes, and people as much as projects.`

async function main() {
  console.log('🌱 Starting seed...')

  // Clear existing data
  console.log('Clearing existing data...')
  await prisma.feedback.deleteMany()
  await prisma.draft.deleteMany()
  await prisma.essay.deleteMany()
  await prisma.application.deleteMany()
  await prisma.studentCoach.deleteMany()
  await prisma.package.deleteMany()
  await prisma.subscription.deleteMany()
  await prisma.coachProfile.deleteMany()
  await prisma.user.deleteMany()

  // Create demo coach
  console.log('Creating demo coach...')
  const hashedPassword = await bcrypt.hash('password123', 10)

  const coach = await prisma.user.create({
    data: {
      email: 'coach@draftly.com',
      password: hashedPassword,
      name: 'Dr. Sarah Mitchell',
      role: 'COACH',
    },
  })

  // Create coach profile
  const coachProfile = await prisma.coachProfile.create({
    data: {
      userId: coach.id,
      bio: 'Former admissions officer at Stanford University with 15+ years of experience helping students craft compelling college essays. Specialized in personal statements and "Why College" essays.',
      turnaroundDays: 2,
      isAcceptingNew: true,
    },
  })

  // Create demo students
  console.log('Creating demo students...')
  const students = await Promise.all([
    prisma.user.create({
      data: {
        email: 'emma.chen@example.com',
        password: hashedPassword,
        name: 'Emma Chen',
        role: 'STUDENT',
      },
    }),
    prisma.user.create({
      data: {
        email: 'marcus.johnson@example.com',
        password: hashedPassword,
        name: 'Marcus Johnson',
        role: 'STUDENT',
      },
    }),
    prisma.user.create({
      data: {
        email: 'sofia.rodriguez@example.com',
        password: hashedPassword,
        name: 'Sofia Rodriguez',
        role: 'STUDENT',
      },
    }),
    prisma.user.create({
      data: {
        email: 'aiden.patel@example.com',
        password: hashedPassword,
        name: 'Aiden Patel',
        role: 'STUDENT',
      },
    }),
    prisma.user.create({
      data: {
        email: 'olivia.kim@example.com',
        password: hashedPassword,
        name: 'Olivia Kim',
        role: 'STUDENT',
      },
    }),
  ])

  console.log(`Created ${students.length} demo students`)

  // Create Applications for demo students
  console.log('Creating college applications...')

  // Emma Chen - 3 applications
  const today = new Date()
  const emmaStanford = await prisma.application.create({
    data: {
      userId: students[0].id,
      schoolName: 'Stanford University',
      deadline: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      status: 'IN_PROGRESS',
      priority: 1,
    },
  })

  const emmaMIT = await prisma.application.create({
    data: {
      userId: students[0].id,
      schoolName: 'MIT',
      deadline: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now (urgent!)
      status: 'IN_PROGRESS',
      priority: 2,
    },
  })

  const emmaUCBerkeley = await prisma.application.create({
    data: {
      userId: students[0].id,
      schoolName: 'UC Berkeley',
      deadline: new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      status: 'IN_PROGRESS',
      priority: 3,
    },
  })

  // Marcus Johnson - 2 applications
  const marcusYale = await prisma.application.create({
    data: {
      userId: students[1].id,
      schoolName: 'Yale University',
      deadline: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000), // 3 weeks from now
      status: 'IN_PROGRESS',
      priority: 1,
    },
  })

  const marcusHarvard = await prisma.application.create({
    data: {
      userId: students[1].id,
      schoolName: 'Harvard University',
      deadline: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      status: 'IN_PROGRESS',
      priority: 2,
    },
  })

  // Sofia Rodriguez - 3 applications
  const sofiaPrinceton = await prisma.application.create({
    data: {
      userId: students[2].id,
      schoolName: 'Princeton University',
      deadline: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
      status: 'IN_PROGRESS',
      priority: 1,
    },
  })

  const sofiaColumbia = await prisma.application.create({
    data: {
      userId: students[2].id,
      schoolName: 'Columbia University',
      deadline: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      status: 'IN_PROGRESS',
      priority: 2,
    },
  })

  const sofiaUCLA = await prisma.application.create({
    data: {
      userId: students[2].id,
      schoolName: 'UCLA',
      deadline: new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      status: 'IN_PROGRESS',
      priority: 3,
    },
  })

  // Aiden Patel - 2 applications
  const aidenCornell = await prisma.application.create({
    data: {
      userId: students[3].id,
      schoolName: 'Cornell University',
      deadline: new Date(today.getTime() + 28 * 24 * 60 * 60 * 1000), // 4 weeks from now
      status: 'IN_PROGRESS',
      priority: 1,
    },
  })

  const aidenNorthwestern = await prisma.application.create({
    data: {
      userId: students[3].id,
      schoolName: 'Northwestern University',
      deadline: new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
      status: 'NOT_STARTED',
      priority: 2,
    },
  })

  // Olivia Kim - 2 applications
  const oliviaBrown = await prisma.application.create({
    data: {
      userId: students[4].id,
      schoolName: 'Brown University',
      deadline: new Date(today.getTime() + 12 * 24 * 60 * 60 * 1000), // 12 days from now
      status: 'IN_PROGRESS',
      priority: 1,
    },
  })

  const oliviaUPenn = await prisma.application.create({
    data: {
      userId: students[4].id,
      schoolName: 'University of Pennsylvania',
      deadline: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: 'IN_PROGRESS',
      priority: 2,
    },
  })

  console.log('Created 14 college applications')

  // Create Essays with various statuses
  console.log('Creating essays with various statuses...')

  // Emma Chen's Essays
  // 1. Common App Personal Statement (Robotics) - APPROVED (excellent essay)
  const emmaCommonApp = await prisma.essay.create({
    data: {
      userId: students[0].id,
      title: 'Common App Personal Statement',
      prompt: 'The lessons we take from obstacles we encounter can be fundamental to later success. Recount a time when you faced a challenge, setback, or failure. How did it affect you, and what did you learn from the experience?',
      status: 'APPROVED',
      wordCount: 648,
    },
  })

  // 2. Why Stanford Essay - IN_REVIEW
  const emmaWhyStanford = await prisma.essay.create({
    data: {
      userId: students[0].id,
      applicationId: emmaStanford.id,
      title: 'Why Stanford?',
      prompt: 'Why Stanford? (250 words)',
      status: 'IN_REVIEW',
      wordCount: 249,
    },
  })

  // 3. Why MIT Essay - SUBMITTED (awaiting review)
  const emmaWhyMIT = await prisma.essay.create({
    data: {
      userId: students[0].id,
      applicationId: emmaMIT.id,
      title: 'Why MIT?',
      prompt: 'Why MIT? (250 words)',
      status: 'SUBMITTED',
      wordCount: 247,
    },
  })

  // Marcus Johnson's Essays
  // 1. Common App Personal Statement (Piano) - NEEDS_REVISION (good but needs work)
  const marcusCommonApp = await prisma.essay.create({
    data: {
      userId: students[1].id,
      title: 'Common App Personal Statement',
      prompt: 'The lessons we take from obstacles we encounter can be fundamental to later success. Recount a time when you faced a challenge, setback, or failure. How did it affect you, and what did you learn from the experience?',
      status: 'NEEDS_REVISION',
      wordCount: 587,
    },
  })

  // 2. Extracurricular Activity Essay (Debate) - SUBMITTED
  const marcusDebate = await prisma.essay.create({
    data: {
      userId: students[1].id,
      title: 'Meaningful Extracurricular Activity',
      prompt: 'Describe an activity that has been meaningful to you.',
      status: 'SUBMITTED',
      wordCount: 342,
    },
  })

  // Sofia Rodriguez's Essays
  // 1. Common App Personal Statement (Cooking) - IN_REVIEW (developing essay)
  const sofiaCommonApp = await prisma.essay.create({
    data: {
      userId: students[2].id,
      title: 'Common App Personal Statement',
      prompt: 'The lessons we take from obstacles we encounter can be fundamental to later success. Recount a time when you faced a challenge, setback, or failure. How did it affect you, and what did you learn from the experience?',
      status: 'IN_REVIEW',
      wordCount: 612,
    },
  })

  // 2. Diversity Essay - NEEDS_REVISION
  const sofiaDiversity = await prisma.essay.create({
    data: {
      userId: students[2].id,
      title: 'Diversity Essay',
      prompt: 'Discuss an aspect of your identity, background, or story that is essential to who you are.',
      status: 'NEEDS_REVISION',
      wordCount: 428,
    },
  })

  // Aiden Patel's Essays
  // 1. Common App Personal Statement (Soccer) - DRAFT (needs significant work)
  const aidenCommonApp = await prisma.essay.create({
    data: {
      userId: students[3].id,
      title: 'Common App Personal Statement',
      prompt: 'The lessons we take from obstacles we encounter can be fundamental to later success. Recount a time when you faced a challenge, setback, or failure. How did it affect you, and what did you learn from the experience?',
      status: 'DRAFT',
      wordCount: 456,
    },
  })

  // Olivia Kim's Essays
  // 1. "What Matters to You" - SUBMITTED
  const oliviaWhatMatters = await prisma.essay.create({
    data: {
      userId: students[4].id,
      title: 'What Matters to You and Why?',
      prompt: 'What matters to you, and why? (150 words)',
      status: 'SUBMITTED',
      wordCount: 149,
    },
  })

  // 2. Community Essay - APPROVED
  const oliviaCommunity = await prisma.essay.create({
    data: {
      userId: students[4].id,
      title: 'Community You Belong To',
      prompt: 'Describe a community you belong to and your place within it.',
      status: 'APPROVED',
      wordCount: 298,
    },
  })

  console.log('Created 10 essays in various statuses')

  // Create Draft versions for essays
  console.log('Creating draft versions...')

  // Emma's Common App (APPROVED) - 3 versions showing progression to excellent
  await prisma.draft.create({
    data: {
      essayId: emmaCommonApp.id,
      content: ESSAY_EXCELLENT_ROBOTICS.substring(0, 400) + '...\n\n[Early draft was shorter and less developed]',
      versionNumber: 1,
      wordCount: 412,
    },
  })

  await prisma.draft.create({
    data: {
      essayId: emmaCommonApp.id,
      content: ESSAY_EXCELLENT_ROBOTICS.substring(0, 800) + '...\n\n[Second draft expanded but needed better conclusion]',
      versionNumber: 2,
      wordCount: 542,
    },
  })

  await prisma.draft.create({
    data: {
      essayId: emmaCommonApp.id,
      content: ESSAY_EXCELLENT_ROBOTICS,
      versionNumber: 3,
      wordCount: 648,
    },
  })

  // Emma's Why Stanford (IN_REVIEW) - 2 versions
  await prisma.draft.create({
    data: {
      essayId: emmaWhyStanford.id,
      content: ESSAY_WHY_STANFORD.substring(0, 600) + '...\n\n[First draft needed more specific details]',
      versionNumber: 1,
      wordCount: 198,
    },
  })

  await prisma.draft.create({
    data: {
      essayId: emmaWhyStanford.id,
      content: ESSAY_WHY_STANFORD,
      versionNumber: 2,
      wordCount: 249,
    },
  })

  // Emma's Why MIT (SUBMITTED) - 1 version
  await prisma.draft.create({
    data: {
      essayId: emmaWhyMIT.id,
      content: ESSAY_WHY_MIT,
      versionNumber: 1,
      wordCount: 247,
    },
  })

  // Marcus's Common App (NEEDS_REVISION) - 2 versions
  await prisma.draft.create({
    data: {
      essayId: marcusCommonApp.id,
      content: ESSAY_GOOD_PIANO.substring(0, 500) + '...\n\n[First draft was too brief]',
      versionNumber: 1,
      wordCount: 423,
    },
  })

  await prisma.draft.create({
    data: {
      essayId: marcusCommonApp.id,
      content: ESSAY_GOOD_PIANO,
      versionNumber: 2,
      wordCount: 587,
    },
  })

  // Marcus's Debate Essay (SUBMITTED) - 1 version
  await prisma.draft.create({
    data: {
      essayId: marcusDebate.id,
      content: ESSAY_DEBATE_ACTIVITY,
      versionNumber: 1,
      wordCount: 342,
    },
  })

  // Sofia's Common App (IN_REVIEW) - 2 versions
  await prisma.draft.create({
    data: {
      essayId: sofiaCommonApp.id,
      content: ESSAY_DEVELOPING_COOKING.substring(0, 700) + '...\n\n[First version ended abruptly]',
      versionNumber: 1,
      wordCount: 478,
    },
  })

  await prisma.draft.create({
    data: {
      essayId: sofiaCommonApp.id,
      content: ESSAY_DEVELOPING_COOKING,
      versionNumber: 2,
      wordCount: 612,
    },
  })

  // Sofia's Diversity Essay (NEEDS_REVISION) - 2 versions
  await prisma.draft.create({
    data: {
      essayId: sofiaDiversity.id,
      content: ESSAY_FIRST_GEN_DIVERSITY.substring(0, 600) + '...\n\n[Earlier draft lacked specific examples]',
      versionNumber: 1,
      wordCount: 356,
    },
  })

  await prisma.draft.create({
    data: {
      essayId: sofiaDiversity.id,
      content: ESSAY_FIRST_GEN_DIVERSITY,
      versionNumber: 2,
      wordCount: 428,
    },
  })

  // Aiden's Common App (DRAFT) - 1 version (needs significant work)
  await prisma.draft.create({
    data: {
      essayId: aidenCommonApp.id,
      content: ESSAY_NEEDS_WORK_SOCCER,
      versionNumber: 1,
      wordCount: 456,
    },
  })

  // Olivia's What Matters (SUBMITTED) - 1 version
  await prisma.draft.create({
    data: {
      essayId: oliviaWhatMatters.id,
      content: ESSAY_WHAT_MATTERS,
      versionNumber: 1,
      wordCount: 149,
    },
  })

  // Olivia's Community Essay (APPROVED) - 3 versions showing progression
  await prisma.draft.create({
    data: {
      essayId: oliviaCommunity.id,
      content: ESSAY_COMMUNITY_ROBOTICS.substring(0, 500) + '...\n\n[First draft was too general]',
      versionNumber: 1,
      wordCount: 187,
    },
  })

  await prisma.draft.create({
    data: {
      essayId: oliviaCommunity.id,
      content: ESSAY_COMMUNITY_ROBOTICS.substring(0, 900) + '...\n\n[Second draft added specifics but needed stronger conclusion]',
      versionNumber: 2,
      wordCount: 243,
    },
  })

  await prisma.draft.create({
    data: {
      essayId: oliviaCommunity.id,
      content: ESSAY_COMMUNITY_ROBOTICS,
      versionNumber: 3,
      wordCount: 298,
    },
  })

  console.log('Created 19 draft versions across all essays')

  // Create Coach Feedback with inline comments
  console.log('Creating coach feedback...')

  // Feedback for Emma's Common App (APPROVED) - feedback on version 2 that led to approval
  await prisma.feedback.create({
    data: {
      essayId: emmaCommonApp.id,
      coachId: coach.id,
      draftVersionReviewed: 2,
      summaryFeedback: 'This is a strong essay that effectively demonstrates your growth as a leader. Your narrative arc is clear, and you\'ve done an excellent job showing rather than telling. The specific details about the broken servo and your team\'s collaborative response are particularly powerful.',
      strengths: '- Strong opening that immediately establishes stakes and context\n- Excellent use of specific examples (servo failure, arm design discussion)\n- Clear demonstration of personal growth and leadership development\n- Effective connection to broader applications beyond robotics\n- Authentic voice throughout',
      priorityRevisions: '- Consider strengthening the conclusion with one more concrete example of how you\'ve applied these lessons\n- The transition between the second competition and the reflection could be smoother\n- Word count is good but you have room for ~50 more words if you want to expand',
      overallGuidance: 'This essay is very close to being ready. The one revision would make it even stronger. Focus on making the conclusion more specific - perhaps mention a particular moment in student government or your research internship that illustrates the leadership principles you learned. Once you make this revision, this will be a compelling personal statement.',
      inlineComments: JSON.stringify([
        {
          id: '1',
          startIndex: 245,
          endIndex: 350,
          comment: 'Love this detail! It immediately shows the human element of the challenge.'
        },
        {
          id: '2',
          startIndex: 789,
          endIndex: 920,
          comment: 'This question-based approach is a great specific example of changed behavior. Very effective.'
        },
        {
          id: '3',
          startIndex: 1100,
          endIndex: 1180,
          comment: 'Good example, but could be even more specific - what exactly did you do in student government?'
        }
      ]),
    },
  })

  // Feedback for Marcus's Common App (NEEDS_REVISION) - constructive criticism
  await prisma.feedback.create({
    data: {
      essayId: marcusCommonApp.id,
      coachId: coach.id,
      draftVersionReviewed: 2,
      summaryFeedback: 'You have a compelling story here about rediscovering your passion for music. The concept of distinguishing between quitting and redirecting is insightful. However, the essay needs more showing and less telling, particularly in the middle sections.',
      strengths: '- Honest and relatable opening\n- Good insight about external validation vs. internal motivation\n- The jazz discovery moment is authentic\n- Strong thematic thread about finding your own path',
      priorityRevisions: '- The "exploration" paragraph (visiting friends\' activities) feels rushed. Add specific sensory details or moments.\n- Show us the moment you first listened to "Kind of Blue" - what did you hear? What changed?\n- The return to Mrs. Liu feels too convenient. What was that conversation like? What made you decide to go back?\n- Consider cutting some of the general reflection and replacing it with more specific scenes',
      overallGuidance: 'This essay has real potential, but it\'s currently too abstract in places. College essays succeed when they balance reflection with vivid, specific moments. Your best sections are where you show us scenes (quitting, the record player). Expand those and create similar moments for your jazz discovery and return to piano. Aim to make the reader feel like they\'re experiencing these moments with you.',
      inlineComments: JSON.stringify([
        {
          id: '1',
          startIndex: 420,
          endIndex: 550,
          comment: 'This paragraph lists activities but doesn\'t give us any scenes. Pick one and show us a specific moment.'
        },
        {
          id: '2',
          startIndex: 650,
          endIndex: 720,
          comment: 'Great transition! This is the kind of specific detail that brings the essay alive.'
        },
        {
          id: '3',
          startIndex: 1200,
          endIndex: 1350,
          comment: 'This reflection is good but it would be more powerful after showing us a specific jazz performance or practice session.'
        }
      ]),
    },
  })

  // Feedback for Sofia's Diversity Essay (NEEDS_REVISION)
  await prisma.feedback.create({
    data: {
      essayId: sofiaDiversity.id,
      coachId: coach.id,
      draftVersionReviewed: 2,
      summaryFeedback: 'You\'ve identified a meaningful aspect of your identity and shown how it shapes your perspective. The financial aid night example is excellent. The essay would benefit from deepening the personal narrative and showing more vulnerability about navigating between two worlds.',
      strengths: '- The financial aid night example is concrete and impactful\n- Clear articulation of how your perspective creates value\n- Good connection to future goals\n- Authentic voice',
      priorityRevisions: '- The opening feels a bit distant. Can you show us the moment of that conversation with your counselor more vividly?\n- Add one more specific example of "translating" between home and school - a particular moment, not general statement\n- The "two worlds" concept is introduced but not fully explored. What does it feel like to navigate between them?\n- The conclusion could be stronger - instead of stating what you\'ll bring, show us by pointing to what you\'re already doing',
      overallGuidance: 'This essay demonstrates awareness of how your background shapes you, which is great. Now go deeper into the emotional reality of being first-generation. Admissions officers read many first-gen essays - yours will stand out if it reveals something unexpected or particularly honest about the experience. Don\'t be afraid to show the difficulties alongside the strengths.',
      inlineComments: JSON.stringify([
        {
          id: '1',
          startIndex: 0,
          endIndex: 180,
          comment: 'Can you recreate this conversation scene? What was said? Where were you? What did you feel?'
        },
        {
          id: '2',
          startIndex: 450,
          endIndex: 620,
          comment: 'This is your strongest paragraph - specific, detailed, showing impact. More like this!'
        },
        {
          id: '3',
          startIndex: 850,
          endIndex: 950,
          comment: 'Good point but too general. Give us a specific example from CS class or student government.'
        }
      ]),
    },
  })

  // Feedback for Olivia's Community Essay (APPROVED)
  await prisma.feedback.create({
    data: {
      essayId: oliviaCommunity.id,
      coachId: coach.id,
      draftVersionReviewed: 3,
      summaryFeedback: 'Excellent essay! You\'ve created a vivid portrait of your robotics community while clearly demonstrating your role and growth within it. The essay balances specific details with thoughtful reflection, and your voice comes through authentically.',
      strengths: '- Vivid opening that immediately places us in the scene\n- Specific examples (Priya mentoring you, the deleted assembly file)\n- Clear demonstration of your growth from mentee to mentor\n- Insightful reflection on what makes communities strong\n- Strong conclusion that looks forward',
      priorityRevisions: 'None - this essay is ready to submit. You might consider whether "organized chaos" in both the opening and your Stanford essay is too repetitive, but that\'s minor.',
      overallGuidance: 'This is a polished, compelling essay that effectively communicates both your values and your growth. The parallel structure (being mentored, then mentoring others) works really well. Your reflection on community as something that "reproduces itself" in culture and values is sophisticated without being pretentious. Great work!',
      inlineComments: JSON.stringify([
        {
          id: '1',
          startIndex: 0,
          endIndex: 150,
          comment: 'Perfect opening - sensory, specific, and immediately engaging.'
        },
        {
          id: '2',
          startIndex: 580,
          endIndex: 680,
          comment: 'Love this specific example. It shows grace under pressure and learning culture.'
        },
        {
          id: '3',
          startIndex: 1050,
          endIndex: 1180,
          comment: 'Sophisticated insight that elevates the essay beyond just describing the club.'
        }
      ]),
    },
  })

  console.log('Created 4 feedback entries with inline comments')

  // Create Pricing Packages
  console.log('Creating pricing packages...')

  const starterPackage = await prisma.package.create({
    data: {
      coachId: coachProfile.id,
      name: 'Starter Package',
      reviewCredits: 3,
      priceInCents: 24900, // $249
      isActive: true,
    },
  })

  const essentialPackage = await prisma.package.create({
    data: {
      coachId: coachProfile.id,
      name: 'Essential Package',
      reviewCredits: 5,
      priceInCents: 39900, // $399
      isActive: true,
    },
  })

  const comprehensivePackage = await prisma.package.create({
    data: {
      coachId: coachProfile.id,
      name: 'Comprehensive Package',
      reviewCredits: 10,
      priceInCents: 69900, // $699
      isActive: true,
    },
  })

  const premiumPackage = await prisma.package.create({
    data: {
      coachId: coachProfile.id,
      name: 'Premium Unlimited',
      reviewCredits: 20,
      priceInCents: 119900, // $1199
      isActive: true,
    },
  })

  console.log('Created 4 pricing packages')

  // Create StudentCoach relationships
  console.log('Creating student-coach relationships...')

  // Emma Chen - Comprehensive Package, 7 credits remaining (used 3)
  await prisma.studentCoach.create({
    data: {
      studentId: students[0].id,
      coachId: coachProfile.id,
      creditsRemaining: 7,
      packageId: comprehensivePackage.id,
    },
  })

  // Marcus Johnson - Essential Package, 3 credits remaining (used 2)
  await prisma.studentCoach.create({
    data: {
      studentId: students[1].id,
      coachId: coachProfile.id,
      creditsRemaining: 3,
      packageId: essentialPackage.id,
    },
  })

  // Sofia Rodriguez - Starter Package, 1 credit remaining (used 2)
  await prisma.studentCoach.create({
    data: {
      studentId: students[2].id,
      coachId: coachProfile.id,
      creditsRemaining: 1,
      packageId: starterPackage.id,
    },
  })

  // Aiden Patel - Essential Package, 5 credits remaining (unused)
  await prisma.studentCoach.create({
    data: {
      studentId: students[3].id,
      coachId: coachProfile.id,
      creditsRemaining: 5,
      packageId: essentialPackage.id,
    },
  })

  // Olivia Kim - Comprehensive Package, 8 credits remaining (used 2)
  await prisma.studentCoach.create({
    data: {
      studentId: students[4].id,
      coachId: coachProfile.id,
      creditsRemaining: 8,
      packageId: comprehensivePackage.id,
    },
  })

  console.log('Created 5 student-coach relationships')

  console.log('✅ Seed script infrastructure created successfully!')
  console.log('\nDemo accounts:')
  console.log('Coach: coach@draftly.com / password123')
  console.log('Students:')
  students.forEach(student => {
    console.log(`  - ${student.email} / password123`)
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Error seeding database:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
