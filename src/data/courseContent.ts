// src/data/courseContent.ts

export interface LearningObjective {
  id: string;
  text: string;
}

export interface ContentBlock {
  type: 'paragraph' | 'heading' | 'callout' | 'example' | 'warning' | 'table' | 'list';
  content?: string;
  items?: string[];
  title?: string;
  variant?: 'info' | 'tip' | 'warning' | 'important';
  headers?: string[];
  rows?: string[][];
}

export interface ModuleData {
  id: string;
  title: string;
  description: string;
  learningObjectives: LearningObjective[];
  sections: {
    title: string;
    content: ContentBlock[];
  }[];
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface ReviewQuestion {
  id: string;
  question: string;
  options: QuestionOption[];
  correctAnswer: string;
  feedback: {
    correct: string;
    incorrect: string;
  };
  explanation: string;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  options: QuestionOption[];
  correctAnswer: string;
  explanation: string;
  moduleReference: string;
}

export interface EvaluationQuestion {
  id: string;
  question: string;
  type: 'likert' | 'text';
}

export interface CourseData {
  title: string;
  subtitle: string;
  description: string;
  cpeCredits: number;
  passingScore: number;
  totalAssessmentQuestions: number;
  learningObjectives: string[];
  modules: ModuleData[];
  reviewQuestions: Record<string, ReviewQuestion[]>;
  assessmentQuestions: AssessmentQuestion[];
  evaluationQuestions: EvaluationQuestion[];
}

export const courseData: CourseData = {
  title: "Achieving Effective Internal Control Over Generative AI",
  subtitle: "COSO Framework Application",
  description: "This self-study course explores how organizations can apply the COSO Internal Control — Integrated Framework to establish effective governance and controls over generative AI systems. Through three instructional modules, participants will examine the control environment, risk assessment, control activities, information and communication, and monitoring activities as they relate to AI implementation and operations.",
  cpeCredits: 1.0,
  passingScore: 70,
  totalAssessmentQuestions: 15,
  learningObjectives: [
    "Identify the key components of the COSO framework and their relevance to generative AI governance",
    "Evaluate how the control environment principles apply to AI oversight and organizational culture",
    "Assess risks specific to generative AI systems, including bias, hallucination, data privacy, and model drift",
    "Design control activities that address the unique challenges of AI model development, deployment, and operations",
    "Implement information and communication strategies for AI transparency and stakeholder reporting",
    "Develop monitoring activities to ensure ongoing effectiveness of AI controls"
  ],
  modules: [
    {
      id: "module1",
      title: "Module 1: The COSO Framework and AI Governance Foundations",
      description: "This module introduces the COSO Internal Control — Integrated Framework and establishes its relevance to governing generative AI systems within organizations.",
      learningObjectives: [
        { id: "lo1-1", text: "Describe the five components of the COSO framework" },
        { id: "lo1-2", text: "Explain how the control environment sets the tone for AI governance" },
        { id: "lo1-3", text: "Identify board and management responsibilities in AI oversight" }
      ],
      sections: [
        {
          title: "Introduction to COSO and Generative AI",
          content: [
            { type: 'paragraph', content: 'The Committee of Sponsoring Organizations of the Treadway Commission (COSO) published its Internal Control — Integrated Framework to help organizations design and evaluate internal controls. Originally focused on financial reporting, the framework has proven adaptable to a wide range of operational and compliance objectives — including the governance of emerging technologies such as generative AI.' },
            { type: 'callout', variant: 'info', title: 'Key Concept', content: 'Generative AI refers to artificial intelligence systems capable of creating new content — text, images, code, audio, and video — based on patterns learned from training data. Examples include large language models (LLMs) like GPT-4, Claude, and Gemini.' },
            { type: 'paragraph', content: 'As organizations adopt generative AI across functions — from customer service chatbots to automated document drafting — the need for structured internal controls becomes critical. Without appropriate governance, AI systems can introduce risks including:' },
            { type: 'list', items: [
              'Inaccurate or misleading outputs (hallucinations)',
              'Bias in decision-making processes',
              'Unauthorized disclosure of sensitive data',
              'Regulatory and compliance violations',
              'Reputational damage from uncontrolled AI behavior'
            ]},
            { type: 'paragraph', content: 'The COSO framework provides a structured, principle-based approach to addressing these risks through five interrelated components.' }
          ]
        },
        {
          title: "The Five Components of COSO",
          content: [
            { type: 'paragraph', content: 'The COSO framework consists of five components that work together to support the achievement of an organization\'s objectives:' },
            { type: 'table', headers: ['Component', 'Description', 'AI Governance Relevance'], rows: [
              ['Control Environment', 'The set of standards, processes, and structures that provide the foundation for internal control across the organization', 'Establishes the organizational tone for responsible AI use, including ethics policies, oversight structures, and accountability frameworks'],
              ['Risk Assessment', 'The process of identifying and analyzing risks to achieving objectives, forming the basis for how risks should be managed', 'Identifies AI-specific risks including bias, hallucination, data leakage, model drift, and adversarial attacks'],
              ['Control Activities', 'Actions established through policies and procedures to mitigate risks to acceptable levels', 'Implements technical and operational controls over AI model development, testing, deployment, and ongoing operations'],
              ['Information & Communication', 'Relevant, quality information is identified, captured, and communicated in a timely manner', 'Ensures AI system transparency, explainability, and stakeholder communication about AI capabilities and limitations'],
              ['Monitoring Activities', 'Ongoing evaluations, separate evaluations, or some combination used to confirm controls are present and functioning', 'Continuous monitoring of AI model performance, bias metrics, and control effectiveness']
            ]},
            { type: 'warning', title: 'Important', content: 'The five COSO components are not sequential steps — they operate simultaneously and are interrelated. An organization cannot achieve effective internal control by addressing components in isolation.' }
          ]
        },
        {
          title: "Control Environment for AI Governance",
          content: [
            { type: 'paragraph', content: 'The control environment is the foundation of the entire internal control system. For AI governance, this means establishing:' },
            { type: 'list', items: [
              'Board-level oversight of AI strategy and risk appetite',
              'Clear accountability structures for AI decisions and outcomes',
              'An organizational culture that values responsible AI development and use',
              'Policies that define acceptable and prohibited uses of generative AI',
              'Competency requirements for personnel involved in AI development and oversight'
            ]},
            { type: 'example', title: 'Real-World Example', content: 'A financial services firm establishes an AI Ethics Committee, chaired by the Chief Risk Officer and reporting to the Board Risk Committee. The committee reviews all generative AI use cases before deployment, sets risk tolerance thresholds for model accuracy and bias, and conducts quarterly reviews of deployed AI systems. This structure demonstrates COSO Principle 2: "The board of directors demonstrates independence from management and exercises oversight of internal control."' },
            { type: 'callout', variant: 'tip', title: 'Practice Tip', content: 'When evaluating an organization\'s AI control environment, assess whether AI governance is treated as a standalone initiative or integrated into existing enterprise risk management. Integrated approaches typically demonstrate stronger control environments.' },
            { type: 'paragraph', content: 'COSO identifies five principles related to the control environment. Each has direct application to AI governance:' },
            { type: 'table', headers: ['COSO Principle', 'AI Application'], rows: [
              ['1. Commitment to integrity and ethical values', 'AI ethics policies, responsible AI principles, prohibition of deceptive AI uses'],
              ['2. Board exercises oversight', 'Board-level AI governance committee, regular AI risk reporting to the board'],
              ['3. Management establishes structure, authority, and responsibility', 'AI Center of Excellence, clear roles for AI development, review, and deployment approval'],
              ['4. Commitment to competence', 'AI literacy training, specialized AI risk assessment skills, data science competency frameworks'],
              ['5. Enforces accountability', 'Individual accountability for AI system outcomes, performance metrics tied to responsible AI use']
            ]}
          ]
        }
      ]
    },
    {
      id: "module2",
      title: "Module 2: Risk Assessment and Control Activities for Generative AI",
      description: "This module examines how organizations identify, assess, and mitigate risks specific to generative AI systems through targeted control activities.",
      learningObjectives: [
        { id: "lo2-1", text: "Identify risks unique to generative AI systems" },
        { id: "lo2-2", text: "Apply the COSO risk assessment process to AI-specific scenarios" },
        { id: "lo2-3", text: "Design control activities to mitigate AI risks" }
      ],
      sections: [
        {
          title: "AI Risk Identification and Analysis",
          content: [
            { type: 'paragraph', content: 'Risk assessment under COSO requires organizations to identify events that could adversely affect their ability to achieve objectives, assess the likelihood and impact of those events, and determine how they should be managed. Generative AI introduces a unique risk profile that differs significantly from traditional IT systems.' },
            { type: 'callout', variant: 'important', title: 'Key Distinction', content: 'Unlike deterministic software systems that produce predictable outputs for given inputs, generative AI systems are probabilistic — they may produce different outputs for the same input. This non-deterministic nature fundamentally changes how risk must be assessed and controlled.' },
            { type: 'paragraph', content: 'Organizations must assess the following categories of AI-specific risk:' },
            { type: 'table', headers: ['Risk Category', 'Description', 'Example'], rows: [
              ['Output Accuracy (Hallucination)', 'AI generates plausible but factually incorrect content', 'An AI assistant provides a client with fabricated regulatory citations in a compliance memo'],
              ['Bias and Fairness', 'AI outputs reflect or amplify biases present in training data', 'A hiring AI disproportionately screens out candidates from certain demographic groups'],
              ['Data Privacy and Confidentiality', 'Sensitive information is exposed through AI interactions', 'An employee pastes confidential client data into a public AI chatbot, which may be used for training'],
              ['Model Drift', 'AI performance degrades over time as real-world conditions change', 'A fraud detection model trained on pre-pandemic data fails to recognize new fraud patterns'],
              ['Adversarial Manipulation', 'Bad actors exploit AI vulnerabilities through crafted inputs', 'A prompt injection attack causes an AI customer service bot to override its safety guidelines'],
              ['Intellectual Property', 'AI generates content that infringes on existing intellectual property', 'An AI system generates marketing copy substantially similar to copyrighted material'],
              ['Regulatory Non-Compliance', 'AI use violates existing or emerging regulations', 'An organization deploys AI in a jurisdiction with AI-specific legislation without conducting required impact assessments']
            ]},
            { type: 'warning', title: 'Audit Consideration', content: 'When assessing AI risk, practitioners should evaluate both the inherent risk of the AI system and the residual risk after controls are applied. The gap between inherent and residual risk represents the effectiveness of the control structure.' }
          ]
        },
        {
          title: "Risk Assessment Process for AI",
          content: [
            { type: 'paragraph', content: 'COSO Principle 7 states: "The organization identifies risks to the achievement of its objectives across the entity and analyzes risks as a basis for determining how the risks should be managed." For generative AI, this process should follow a structured methodology:' },
            { type: 'list', items: [
              'Step 1: Inventory all generative AI systems and use cases across the organization',
              'Step 2: Classify each use case by risk tier (critical, high, medium, low) based on potential impact',
              'Step 3: For each use case, identify specific risks from the risk categories above',
              'Step 4: Assess likelihood and impact of each identified risk',
              'Step 5: Evaluate existing controls and determine residual risk',
              'Step 6: Determine risk response — accept, mitigate, transfer, or avoid'
            ]},
            { type: 'example', title: 'Risk Classification Example', content: 'Critical Risk Tier: AI systems that make or directly influence decisions affecting financial reporting, client outcomes, or regulatory compliance. These require the highest level of control, including human-in-the-loop review for all outputs.\n\nHigh Risk Tier: AI systems used in client-facing communications or internal decision support. These require automated quality controls and periodic human review.\n\nMedium Risk Tier: AI tools used for internal productivity (e.g., email drafting, meeting summaries). These require usage policies and monitoring.\n\nLow Risk Tier: AI tools used for non-sensitive exploration or learning. These require basic acceptable use policies.' },
            { type: 'callout', variant: 'info', title: 'COSO Principle 8 — Fraud Risk', content: 'Organizations should specifically assess the risk of fraudulent use of AI, including the creation of deepfakes, generation of fraudulent documents, and manipulation of AI-generated financial analyses. This aligns with COSO Principle 8: "The organization considers the potential for fraud in assessing risks to the achievement of objectives."' }
          ]
        },
        {
          title: "Designing Control Activities for AI",
          content: [
            { type: 'paragraph', content: 'Control activities are the policies and procedures that help ensure management directives are carried out and risks are mitigated. COSO Principle 10 states: "The organization selects and develops control activities that contribute to the mitigation of risks to the achievement of objectives to acceptable levels."' },
            { type: 'paragraph', content: 'For generative AI, control activities span the entire AI lifecycle:' },
            { type: 'table', headers: ['Lifecycle Stage', 'Control Activity', 'Description'], rows: [
              ['Development', 'Training Data Governance', 'Controls over data quality, representativeness, and bias detection in training datasets'],
              ['Development', 'Model Validation', 'Independent testing and validation of model performance before deployment'],
              ['Deployment', 'Approval Gates', 'Formal approval process with documented risk acceptance before production deployment'],
              ['Deployment', 'Access Controls', 'Role-based access to AI systems with principle of least privilege'],
              ['Operations', 'Output Monitoring', 'Real-time monitoring of AI outputs for quality, accuracy, and bias'],
              ['Operations', 'Human-in-the-Loop', 'Required human review for high-risk or critical AI decisions'],
              ['Operations', 'Prompt Management', 'Controlled system prompts with version control and change management'],
              ['Retirement', 'Model Deprecation', 'Formal process for retiring models, including data retention and audit trail preservation']
            ]},
            { type: 'example', title: 'Control Activity Example', content: 'An organization implements a "model card" requirement for every generative AI deployment. The model card documents: the intended use case, known limitations, bias evaluation results, training data sources, performance benchmarks, and the designated model owner. Model cards are reviewed quarterly and updated whenever the model is retrained or fine-tuned. This implements both COSO Principle 10 (control activities) and Principle 13 (relevant, quality information).' },
            { type: 'warning', title: 'Common Pitfall', content: 'Organizations sometimes implement controls that are overly restrictive, effectively preventing beneficial AI use. Effective control design balances risk mitigation with enabling value creation. Controls should be proportionate to the assessed risk level of each AI use case.' }
          ]
        }
      ]
    },
    {
      id: "module3",
      title: "Module 3: Information, Communication, and Monitoring for AI Systems",
      description: "This module addresses how organizations ensure transparency, communication, and ongoing monitoring of AI controls to maintain effectiveness over time.",
      learningObjectives: [
        { id: "lo3-1", text: "Design information and communication processes for AI transparency" },
        { id: "lo3-2", text: "Implement monitoring activities for AI system controls" },
        { id: "lo3-3", text: "Evaluate the effectiveness of an AI internal control program" }
      ],
      sections: [
        {
          title: "Information and Communication for AI Systems",
          content: [
            { type: 'paragraph', content: 'COSO Principle 13 states: "The organization obtains or generates and uses relevant, quality information to support the functioning of internal control." For generative AI systems, the information component addresses transparency, explainability, and the quality of data used in AI operations.' },
            { type: 'paragraph', content: 'Key information requirements for AI governance include:' },
            { type: 'table', headers: ['Information Need', 'Purpose', 'Stakeholders'], rows: [
              ['AI System Inventory', 'Complete record of all AI systems, their purpose, risk tier, and current status', 'Management, Board, Internal Audit, Regulators'],
              ['Model Performance Metrics', 'Accuracy, precision, recall, bias indicators, drift metrics', 'AI Operations Team, Risk Management'],
              ['Incident Reports', 'Documentation of AI failures, near-misses, and corrective actions', 'Management, Board Risk Committee, Compliance'],
              ['Usage Analytics', 'How AI systems are being used, by whom, and for what purposes', 'AI Governance Committee, Compliance'],
              ['Training Data Lineage', 'Source, transformations, and quality assessments of training data', 'AI Development Team, Internal Audit'],
              ['Regulatory Landscape', 'Current and emerging AI regulations applicable to the organization', 'Legal, Compliance, Board']
            ]},
            { type: 'callout', variant: 'info', title: 'Explainability', content: 'COSO Principle 15 addresses external communication. For AI systems, this includes the ability to explain how AI-driven decisions are made. Many jurisdictions are enacting "right to explanation" provisions in AI legislation. Organizations should implement explainability mechanisms before regulatory requirements mandate them.' },
            { type: 'example', title: 'Communication Framework Example', content: 'A professional services firm implements a tiered AI communication framework:\n\n• Board Level: Quarterly AI governance dashboard showing risk heat map, incident summary, and compliance status\n• Management Level: Monthly AI operations report with performance metrics, usage trends, and emerging risks\n• Operational Level: Real-time AI monitoring dashboard with alerts for threshold breaches\n• Client Level: Disclosure statements for any AI-assisted deliverables, including the scope of AI involvement and human review processes' }
          ]
        },
        {
          title: "Monitoring Activities for AI Controls",
          content: [
            { type: 'paragraph', content: 'COSO Principle 16 states: "The organization selects, develops, and performs ongoing and/or separate evaluations to ascertain whether the components of internal control are present and functioning." AI systems require both continuous automated monitoring and periodic human evaluations.' },
            { type: 'table', headers: ['Monitoring Type', 'Frequency', 'Activities'], rows: [
              ['Continuous Automated Monitoring', 'Real-time', 'Output quality scoring, bias detection algorithms, drift detection, usage pattern analysis, anomaly detection in AI behavior'],
              ['Periodic Model Review', 'Quarterly', 'Model performance benchmarking, retraining assessment, training data review, security vulnerability assessment'],
              ['Internal Audit Review', 'Annually', 'End-to-end AI control assessment, compliance with AI policies, effectiveness of governance structure, benchmark against standards and regulations'],
              ['External Assessment', 'As needed', 'Independent AI ethics audit, regulatory examination response, third-party model validation']
            ]},
            { type: 'warning', title: 'Critical Control', content: 'COSO Principle 17 requires that deficiencies be communicated to those responsible for corrective action. For AI systems, this means establishing clear escalation paths when monitoring detects:\n• Model performance falling below defined thresholds\n• Bias metrics exceeding acceptable ranges\n• Unauthorized or policy-violating AI use\n• Security vulnerabilities or data exposure events' },
            { type: 'paragraph', content: 'Effective AI monitoring requires a combination of automated tooling and human judgment. Organizations should invest in:' },
            { type: 'list', items: [
              'AI observability platforms that track model inputs, outputs, and performance over time',
              'Automated bias detection and fairness evaluation tools',
              'Anomaly detection systems for AI behavior patterns',
              'Structured human review processes for high-risk AI outputs',
              'Regular tabletop exercises simulating AI failure scenarios'
            ]}
          ]
        },
        {
          title: "Evaluating AI Control Effectiveness",
          content: [
            { type: 'paragraph', content: 'An organization\'s AI internal control program should be evaluated holistically, considering all five COSO components. The following maturity model provides a framework for assessment:' },
            { type: 'table', headers: ['Maturity Level', 'Characteristics'], rows: [
              ['Level 1: Ad Hoc', 'No formal AI governance; individual departments adopt AI independently; controls are reactive and inconsistent'],
              ['Level 2: Developing', 'AI policy exists but is not consistently enforced; basic risk assessment performed; limited monitoring'],
              ['Level 3: Defined', 'Formal AI governance structure in place; risk assessment methodology established; control activities documented; regular monitoring performed'],
              ['Level 4: Managed', 'AI controls integrated into enterprise risk management; metrics-driven monitoring; regular reporting to board; continuous improvement process'],
              ['Level 5: Optimized', 'AI governance is proactive and anticipatory; controls adapt automatically based on risk signals; organization contributes to industry best practices; full regulatory alignment']
            ]},
            { type: 'callout', variant: 'tip', title: 'Assessment Guidance', content: 'Most organizations today are at Level 1 or Level 2 maturity. The goal of applying the COSO framework is to provide a structured path to Level 3 and beyond. Practitioners should help organizations set realistic timelines for maturity progression, typically 12–18 months per level.' },
            { type: 'example', title: 'Comprehensive Assessment Example', content: 'An internal audit team evaluates an organization\'s AI control program using the following approach:\n\n1. Control Environment: Review AI governance charter, committee meeting minutes, tone-at-the-top communications\n2. Risk Assessment: Examine AI risk register, risk assessment methodology, risk response documentation\n3. Control Activities: Test key controls through observation, inspection, and reperformance\n4. Information & Communication: Evaluate reporting completeness, timeliness, and stakeholder reach\n5. Monitoring: Review monitoring procedures, deficiency tracking, and corrective action follow-up\n\nFindings are mapped to specific COSO principles with recommendations for improvement.' }
          ]
        }
      ]
    }
  ],
  reviewQuestions: {
    review1: [
      {
        id: "r1q1",
        question: "Which of the following best describes the role of the control environment in AI governance?",
        options: [
          { id: "a", text: "It provides the technical infrastructure for deploying AI models" },
          { id: "b", text: "It establishes the organizational tone, oversight structures, and accountability for responsible AI use" },
          { id: "c", text: "It monitors AI outputs for accuracy and bias on a real-time basis" },
          { id: "d", text: "It focuses exclusively on regulatory compliance requirements for AI systems" }
        ],
        correctAnswer: "b",
        feedback: {
          correct: "Correct! The control environment establishes the foundation — including tone at the top, oversight structures, and accountability frameworks — upon which all other AI governance controls are built.",
          incorrect: "Not quite. The control environment is about the organizational foundation — tone, culture, oversight, and accountability — not technical infrastructure or specific monitoring activities."
        },
        explanation: "The control environment is the first component of the COSO framework and sets the foundation for all other internal control components. For AI governance, it encompasses the board's commitment to ethical AI, management structures for oversight, and accountability mechanisms."
      },
      {
        id: "r1q2",
        question: "An AI Ethics Committee chaired by the Chief Risk Officer and reporting to the Board Risk Committee is an example of which COSO principle?",
        options: [
          { id: "a", text: "Principle 1: Commitment to integrity and ethical values" },
          { id: "b", text: "Principle 2: The board demonstrates independence and exercises oversight" },
          { id: "c", text: "Principle 4: Commitment to competence" },
          { id: "d", text: "Principle 5: Enforces accountability" }
        ],
        correctAnswer: "b",
        feedback: {
          correct: "Correct! An AI Ethics Committee with board-level reporting demonstrates Principle 2 — the board exercising independent oversight of internal control, specifically AI governance.",
          incorrect: "Think about which principle relates to board-level oversight and governance structures. The committee reports to the Board Risk Committee, demonstrating a specific type of organizational oversight."
        },
        explanation: "COSO Principle 2 states that the board of directors demonstrates independence from management and exercises oversight of the development and performance of internal control. An AI Ethics Committee with board reporting embodies this principle."
      },
      {
        id: "r1q3",
        question: "Which of the following is NOT a characteristic of generative AI that distinguishes it from traditional software systems for control purposes?",
        options: [
          { id: "a", text: "Generative AI systems are probabilistic and may produce different outputs for the same input" },
          { id: "b", text: "Generative AI can produce plausible but factually incorrect outputs" },
          { id: "c", text: "Generative AI systems always require internet connectivity to function" },
          { id: "d", text: "Generative AI performance can degrade over time as real-world conditions change" }
        ],
        correctAnswer: "c",
        feedback: {
          correct: "Correct! Internet connectivity is not a distinguishing characteristic of generative AI for control purposes. Many AI models can run locally. The other options — probabilistic outputs, hallucination risk, and model drift — are genuine distinguishing characteristics.",
          incorrect: "Consider which option describes a technical infrastructure requirement rather than a fundamental characteristic that affects how we design controls for AI systems."
        },
        explanation: "Generative AI is distinguished for control purposes by its probabilistic nature, potential for hallucination, and susceptibility to model drift. Internet connectivity is an infrastructure consideration, not a distinguishing governance characteristic."
      }
    ],
    review2: [
      {
        id: "r2q1",
        question: "When classifying AI use cases by risk tier, which factor is MOST important in determining whether a use case is 'Critical' risk?",
        options: [
          { id: "a", text: "The cost of the AI system implementation" },
          { id: "b", text: "Whether the AI system makes or directly influences decisions affecting financial reporting, client outcomes, or regulatory compliance" },
          { id: "c", text: "The number of users who interact with the AI system" },
          { id: "d", text: "Whether the AI system was developed in-house or by a third party" }
        ],
        correctAnswer: "b",
        feedback: {
          correct: "Correct! The critical risk tier is defined by the potential impact on financial reporting, client outcomes, or regulatory compliance — areas where errors could have severe consequences.",
          incorrect: "Risk classification should focus on the potential impact of AI decisions, not on cost, user count, or development source. Consider what makes an AI failure most consequential."
        },
        explanation: "Critical risk AI use cases are those where AI decisions directly affect financial reporting, client outcomes, or regulatory compliance. These require the highest level of controls including mandatory human-in-the-loop review."
      },
      {
        id: "r2q2",
        question: "Which control activity addresses the risk of AI model performance degrading over time?",
        options: [
          { id: "a", text: "Access controls with principle of least privilege" },
          { id: "b", text: "Formal approval gates before production deployment" },
          { id: "c", text: "Output monitoring with drift detection metrics" },
          { id: "d", text: "Training data governance and bias detection" }
        ],
        correctAnswer: "c",
        feedback: {
          correct: "Correct! Output monitoring with drift detection directly addresses model drift — the degradation of AI performance over time as real-world conditions change from those in the training data.",
          incorrect: "Consider which control specifically targets the detection and measurement of changing model performance over time. Model drift is an operational concern that requires ongoing monitoring."
        },
        explanation: "Model drift occurs when AI performance degrades because real-world conditions differ from training data conditions. Output monitoring with drift detection metrics is the specific control activity that identifies and addresses this risk."
      },
      {
        id: "r2q3",
        question: "A 'model card' requirement for AI deployments primarily implements which COSO principles?",
        options: [
          { id: "a", text: "Principle 1 (Integrity) and Principle 5 (Accountability)" },
          { id: "b", text: "Principle 8 (Fraud Risk) and Principle 9 (Significant Change)" },
          { id: "c", text: "Principle 10 (Control Activities) and Principle 13 (Relevant Quality Information)" },
          { id: "d", text: "Principle 16 (Ongoing Evaluations) and Principle 17 (Deficiency Communication)" }
        ],
        correctAnswer: "c",
        feedback: {
          correct: "Correct! Model cards serve as both a control activity (Principle 10) — documenting intended use, limitations, and bias evaluations — and as relevant, quality information (Principle 13) that supports ongoing governance decisions.",
          incorrect: "Model cards document the intended use, limitations, bias evaluations, and performance benchmarks of AI models. Think about which principles relate to documented controls and quality information."
        },
        explanation: "Model cards implement Principle 10 by establishing a documented control procedure for AI deployments, and Principle 13 by generating and maintaining relevant, quality information about each AI system."
      }
    ],
    review3: [
      {
        id: "r3q1",
        question: "Under COSO Principle 13, which of the following is the MOST comprehensive information requirement for AI governance?",
        options: [
          { id: "a", text: "A complete AI system inventory including purpose, risk tier, and current status" },
          { id: "b", text: "Monthly financial reports showing AI system costs" },
          { id: "c", text: "Employee satisfaction surveys about AI tool usability" },
          { id: "d", text: "Vendor marketing materials about AI capabilities" }
        ],
        correctAnswer: "a",
        feedback: {
          correct: "Correct! A comprehensive AI system inventory is the foundation of AI information requirements. It provides management, the board, internal audit, and regulators with the visibility needed to govern AI effectively.",
          incorrect: "Consider which information source provides the broadest and most relevant basis for AI governance decisions across multiple stakeholder groups."
        },
        explanation: "COSO Principle 13 requires relevant, quality information to support internal control. An AI system inventory provides the comprehensive baseline needed for all governance activities."
      },
      {
        id: "r3q2",
        question: "What type of monitoring combines real-time automated detection with quarterly human review?",
        options: [
          { id: "a", text: "Continuous monitoring only" },
          { id: "b", text: "A combination of ongoing evaluations and separate evaluations as described in COSO Principle 16" },
          { id: "c", text: "External audit procedures" },
          { id: "d", text: "Management override testing" }
        ],
        correctAnswer: "b",
        feedback: {
          correct: "Correct! COSO Principle 16 explicitly calls for ongoing evaluations (continuous automated monitoring) and/or separate evaluations (periodic human review) to confirm controls are functioning.",
          incorrect: "COSO distinguishes between ongoing evaluations (continuous) and separate evaluations (periodic). The correct answer combines both approaches as recommended by the framework."
        },
        explanation: "COSO Principle 16 recommends a combination of ongoing evaluations (real-time automated monitoring) and separate evaluations (periodic reviews) to provide comprehensive assurance that controls are present and functioning."
      },
      {
        id: "r3q3",
        question: "An organization at 'Level 3: Defined' maturity in AI governance has which of the following characteristics?",
        options: [
          { id: "a", text: "No formal AI governance with individual departments adopting AI independently" },
          { id: "b", text: "AI controls integrated into enterprise risk management with metrics-driven monitoring" },
          { id: "c", text: "Formal AI governance structure, established risk assessment methodology, documented controls, and regular monitoring" },
          { id: "d", text: "Proactive and anticipatory governance with controls that adapt automatically" }
        ],
        correctAnswer: "c",
        feedback: {
          correct: "Correct! Level 3: Defined is characterized by formalized governance structures, established methodologies, documented control activities, and regular monitoring processes.",
          incorrect: "Review the maturity model levels. Level 3 represents formalization — where governance structures, methodologies, and monitoring processes are established and documented."
        },
        explanation: "Level 3: Defined maturity means the organization has moved beyond ad hoc and developing stages to establish formal governance structures, documented risk assessment methodologies, defined control activities, and regular monitoring practices."
      }
    ]
  },
  assessmentQuestions: [
    {
      id: "a1",
      question: "Which COSO component establishes the organizational tone for responsible AI use and includes oversight structures and accountability frameworks?",
      options: [
        { id: "a", text: "Risk Assessment" },
        { id: "b", text: "Control Environment" },
        { id: "c", text: "Monitoring Activities" },
        { id: "d", text: "Information and Communication" }
      ],
      correctAnswer: "b",
      explanation: "The control environment is the foundation of the COSO framework, establishing the tone, oversight structures, and accountability that underpin all other components of AI governance.",
      moduleReference: "Module 1"
    },
    {
      id: "a2",
      question: "An organization requires all AI-generated client deliverables to be reviewed by a qualified professional before delivery. This is an example of which control activity?",
      options: [
        { id: "a", text: "Access controls" },
        { id: "b", text: "Human-in-the-loop review" },
        { id: "c", text: "Output monitoring" },
        { id: "d", text: "Prompt management" }
      ],
      correctAnswer: "b",
      explanation: "Human-in-the-loop review requires human verification of AI outputs before they are acted upon, particularly important for high-risk and critical decisions.",
      moduleReference: "Module 2"
    },
    {
      id: "a3",
      question: "What distinguishes generative AI from deterministic software systems for the purpose of internal control design?",
      options: [
        { id: "a", text: "Generative AI is always more expensive to operate" },
        { id: "b", text: "Generative AI is probabilistic and may produce different outputs for the same input" },
        { id: "c", text: "Generative AI cannot be deployed on-premises" },
        { id: "d", text: "Generative AI requires no human oversight" }
      ],
      correctAnswer: "b",
      explanation: "The probabilistic nature of generative AI — producing potentially different outputs for identical inputs — fundamentally changes how organizations must design and implement internal controls.",
      moduleReference: "Module 1"
    },
    {
      id: "a4",
      question: "COSO Principle 8 regarding fraud risk requires organizations to assess which of the following in the context of AI?",
      options: [
        { id: "a", text: "The risk of AI systems being used fraudulently, including deepfakes and fabricated documents" },
        { id: "b", text: "The risk of AI vendors committing financial fraud" },
        { id: "c", text: "The risk of employees using AI to avoid doing work" },
        { id: "d", text: "The risk of AI systems becoming sentient" }
      ],
      correctAnswer: "a",
      explanation: "COSO Principle 8 requires assessing fraud risk, which for AI includes the potential for creating deepfakes, generating fraudulent documents, and manipulating AI-generated financial analyses.",
      moduleReference: "Module 2"
    },
    {
      id: "a5",
      question: "Which of the following represents the correct sequence for the AI risk assessment process?",
      options: [
        { id: "a", text: "Classify risk → Inventory systems → Identify risks → Assess impact" },
        { id: "b", text: "Inventory systems → Classify by risk tier → Identify specific risks → Assess likelihood and impact → Evaluate controls → Determine risk response" },
        { id: "c", text: "Deploy controls → Identify risks → Monitor effectiveness → Report results" },
        { id: "d", text: "Assess impact → Identify risks → Classify risk → Inventory systems" }
      ],
      correctAnswer: "b",
      explanation: "The structured risk assessment process begins with inventorying all AI systems, then classifying by risk tier, identifying specific risks, assessing likelihood and impact, evaluating existing controls, and determining risk responses.",
      moduleReference: "Module 2"
    },
    {
      id: "a6",
      question: "A tiered AI communication framework with board-level dashboards, management-level reports, and operational-level monitoring addresses which COSO component?",
      options: [
        { id: "a", text: "Control Environment" },
        { id: "b", text: "Risk Assessment" },
        { id: "c", text: "Control Activities" },
        { id: "d", text: "Information and Communication" }
      ],
      correctAnswer: "d",
      explanation: "Information and Communication (COSO Principles 13-15) addresses how relevant information is captured and communicated to appropriate stakeholders at appropriate levels.",
      moduleReference: "Module 3"
    },
    {
      id: "a7",
      question: "Training data governance as a control activity primarily addresses which phase of the AI lifecycle?",
      options: [
        { id: "a", text: "Deployment" },
        { id: "b", text: "Development" },
        { id: "c", text: "Operations" },
        { id: "d", text: "Retirement" }
      ],
      correctAnswer: "b",
      explanation: "Training data governance — including controls over data quality, representativeness, and bias detection — is a development-phase control activity that establishes the foundation for model quality.",
      moduleReference: "Module 2"
    },
    {
      id: "a8",
      question: "An organization at Level 4: Managed maturity in AI governance would be characterized by:",
      options: [
        { id: "a", text: "No formal AI governance with ad hoc controls" },
        { id: "b", text: "AI policy exists but is not consistently enforced" },
        { id: "c", text: "AI controls integrated into enterprise risk management with metrics-driven monitoring and regular board reporting" },
        { id: "d", text: "Proactive governance with controls that adapt automatically based on risk signals" }
      ],
      correctAnswer: "c",
      explanation: "Level 4: Managed maturity is characterized by integration of AI controls into enterprise risk management, metrics-driven monitoring, regular board reporting, and continuous improvement processes.",
      moduleReference: "Module 3"
    },
    {
      id: "a9",
      question: "COSO Principle 17 requires that AI control deficiencies be:",
      options: [
        { id: "a", text: "Hidden from external regulators to protect competitive advantage" },
        { id: "b", text: "Communicated in a timely manner to those responsible for corrective action" },
        { id: "c", text: "Addressed only during annual audit cycles" },
        { id: "d", text: "Documented but not acted upon until the next budget cycle" }
      ],
      correctAnswer: "b",
      explanation: "COSO Principle 17 requires that internal control deficiencies be evaluated and communicated in a timely manner to parties responsible for taking corrective action, including senior management and the board as appropriate.",
      moduleReference: "Module 3"
    },
    {
      id: "a10",
      question: "An employee pastes confidential client data into a public AI chatbot. This scenario represents which category of AI risk?",
      options: [
        { id: "a", text: "Model Drift" },
        { id: "b", text: "Adversarial Manipulation" },
        { id: "c", text: "Data Privacy and Confidentiality" },
        { id: "d", text: "Output Accuracy" }
      ],
      correctAnswer: "c",
      explanation: "This scenario represents a data privacy and confidentiality risk — sensitive information being exposed through AI interactions, potentially becoming part of the AI's training data.",
      moduleReference: "Module 2"
    },
    {
      id: "a11",
      question: "Which monitoring approach does COSO Principle 16 specifically recommend for assessing whether internal controls over AI are present and functioning?",
      options: [
        { id: "a", text: "Annual external audit only" },
        { id: "b", text: "Continuous automated monitoring only" },
        { id: "c", text: "A combination of ongoing evaluations and separate evaluations" },
        { id: "d", text: "Periodic management self-assessment only" }
      ],
      correctAnswer: "c",
      explanation: "COSO Principle 16 recommends ongoing evaluations (continuous automated monitoring) and/or separate evaluations (periodic human review) to provide comprehensive assurance.",
      moduleReference: "Module 3"
    },
    {
      id: "a12",
      question: "The 'right to explanation' requirement in emerging AI legislation most directly relates to which COSO principle?",
      options: [
        { id: "a", text: "Principle 5: Enforces accountability" },
        { id: "b", text: "Principle 10: Selects and develops control activities" },
        { id: "c", text: "Principle 15: Communicates externally" },
        { id: "d", text: "Principle 16: Conducts ongoing and/or separate evaluations" }
      ],
      correctAnswer: "c",
      explanation: "COSO Principle 15 addresses external communication, including the ability to explain AI-driven decisions to external stakeholders, which directly aligns with 'right to explanation' requirements.",
      moduleReference: "Module 3"
    },
    {
      id: "a13",
      question: "When evaluating an organization's AI control environment, which approach typically demonstrates a STRONGER control environment?",
      options: [
        { id: "a", text: "Treating AI governance as a standalone initiative separate from enterprise risk management" },
        { id: "b", text: "Integrating AI governance into existing enterprise risk management frameworks" },
        { id: "c", text: "Delegating all AI governance to the IT department" },
        { id: "d", text: "Relying on AI vendors to manage governance for the organization" }
      ],
      correctAnswer: "b",
      explanation: "Integrated approaches — where AI governance is embedded within existing enterprise risk management — typically demonstrate stronger control environments than standalone or siloed approaches.",
      moduleReference: "Module 1"
    },
    {
      id: "a14",
      question: "A prompt injection attack that causes an AI customer service bot to override its safety guidelines is an example of which AI risk category?",
      options: [
        { id: "a", text: "Bias and Fairness" },
        { id: "b", text: "Output Accuracy" },
        { id: "c", text: "Intellectual Property" },
        { id: "d", text: "Adversarial Manipulation" }
      ],
      correctAnswer: "d",
      explanation: "Adversarial manipulation involves bad actors exploiting AI vulnerabilities through crafted inputs (such as prompt injection) to cause the AI to behave in unintended ways.",
      moduleReference: "Module 2"
    },
    {
      id: "a15",
      question: "Which of the following BEST describes why the five COSO components should not be implemented sequentially for AI governance?",
      options: [
        { id: "a", text: "Sequential implementation is too expensive for most organizations" },
        { id: "b", text: "The components operate simultaneously and are interrelated — effective control requires all five working together" },
        { id: "c", text: "AI technology changes too fast for sequential implementation" },
        { id: "d", text: "Regulators require all components to be implemented at the same time" }
      ],
      correctAnswer: "b",
      explanation: "The COSO framework emphasizes that its five components are interrelated and operate simultaneously. An organization cannot achieve effective internal control by addressing components in isolation or sequentially.",
      moduleReference: "Module 1"
    }
  ],
  evaluationQuestions: [
    {
      id: "e1",
      question: "The stated learning objectives were met.",
      type: "likert"
    },
    {
      id: "e2",
      question: "The course content was relevant to my professional development.",
      type: "likert"
    },
    {
      id: "e3",
      question: "The course materials were clearly presented and well-organized.",
      type: "likert"
    },
    {
      id: "e4",
      question: "The time required to complete the course was appropriate for the content covered.",
      type: "likert"
    },
    {
      id: "e5",
      question: "Please provide any additional comments or suggestions for improving this course.",
      type: "text"
    }
  ]
};
