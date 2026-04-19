"""Create the full demo course so the Wagtail admin + API have realistic content.

Ports the full course from the frontend's former `src/data/courseContent.ts` into
the Wagtail page tree. Re-run with `--force` to wipe and recreate.

SMEs can edit any of this in the Wagtail admin after seeding — the seed just
establishes the baseline content.
"""

from django.core.management.base import BaseCommand
from wagtail.models import Page, Site

from apps.courses.models import (
    AssessmentPage,
    AssessmentQuestion,
    AssessmentQuestionOption,
    CourseIndexPage,
    CourseLearningObjective,
    CoursePage,
    EvaluationPage,
    EvaluationQuestion,
    ModuleLearningObjective,
    ModulePage,
    ReviewPage,
    ReviewQuestion,
    ReviewQuestionOption,
)

DEMO_COURSE_SLUG = "coso-ai-internal-control"


def p(text: str) -> str:
    """Wrap plain text in a paragraph tag for RichText fields."""
    return f"<p>{text}</p>"


class Command(BaseCommand):
    help = "Seed the COSO AI internal-control demo course (3 modules, 3 reviews, 15-q assessment, evaluation)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Delete the existing demo course before creating it.",
        )

    def handle(self, *args, **options):
        force: bool = options["force"]

        catalog = self._get_or_create_catalog()

        existing = catalog.get_children().filter(slug=DEMO_COURSE_SLUG).first()
        if existing:
            if not force:
                self.stdout.write(
                    self.style.WARNING(
                        f"Demo course already exists at /{catalog.slug}/{existing.slug}/. "
                        "Pass --force to recreate."
                    )
                )
                return
            self.stdout.write(f"Deleting existing demo course at {existing.url_path}")
            existing.delete()
            catalog = CourseIndexPage.objects.get(pk=catalog.pk)

        course = self._create_course(catalog)
        self._create_module_1(course)
        self._create_module_2(course)
        self._create_module_3(course)
        self._create_review_1(course)
        self._create_review_2(course)
        self._create_review_3(course)
        self._create_assessment(course)
        self._create_evaluation(course)

        self.stdout.write(self.style.SUCCESS(f"Demo course created at {course.url_path}"))
        self.stdout.write("Open the Wagtail admin to explore: http://localhost:8000/admin/")

    # ----------------------------------------------------------------- catalog
    def _get_or_create_catalog(self) -> CourseIndexPage:
        existing = CourseIndexPage.objects.first()
        if existing:
            return existing

        site = Site.objects.first()
        root_page = Page.objects.get(id=site.root_page_id) if site else Page.get_first_root_node()

        catalog = CourseIndexPage(
            title="Course Catalog",
            slug="catalog",
            intro="<p>Internal training courses.</p>",
        )
        root_page.add_child(instance=catalog)
        catalog.save_revision().publish()

        if site:
            site.root_page = catalog
            site.save()

        self.stdout.write(f"Created catalog at /{catalog.slug}/")
        return catalog

    # ------------------------------------------------------------------ course
    def _create_course(self, catalog: CourseIndexPage) -> CoursePage:
        course = CoursePage(
            title="Achieving Effective Internal Control Over Generative AI",
            slug=DEMO_COURSE_SLUG,
            subtitle="COSO Framework Application",
            description=p(
                "This self-study course explores how organizations can apply the COSO "
                "Internal Control — Integrated Framework to establish effective governance "
                "and controls over generative AI systems. Through three instructional "
                "modules, participants will examine the control environment, risk "
                "assessment, control activities, information and communication, and "
                "monitoring activities as they relate to AI implementation and operations."
            ),
            cpe_credits=1.0,
            passing_score=70,
        )
        catalog.add_child(instance=course)
        course.save_revision().publish()

        for text in [
            "Identify the key components of the COSO framework and their relevance to generative AI governance",
            "Evaluate how the control environment principles apply to AI oversight and organizational culture",
            "Assess risks specific to generative AI systems, including bias, hallucination, data privacy, and model drift",
            "Design control activities that address the unique challenges of AI model development, deployment, and operations",
            "Implement information and communication strategies for AI transparency and stakeholder reporting",
            "Develop monitoring activities to ensure ongoing effectiveness of AI controls",
        ]:
            CourseLearningObjective.objects.create(course=course, text=text)

        return course

    # ---------------------------------------------------------------- module 1
    def _create_module_1(self, course: CoursePage) -> ModulePage:
        module = ModulePage(
            title="Module 1: The COSO Framework and AI Governance Foundations",
            slug="module-1",
            description=p(
                "This module introduces the COSO Internal Control — Integrated Framework "
                "and establishes its relevance to governing generative AI systems within "
                "organizations."
            ),
            sections=[
                (
                    "section",
                    {
                        "title": "Introduction to COSO and Generative AI",
                        "content": [
                            (
                                "paragraph",
                                p(
                                    "The Committee of Sponsoring Organizations of the Treadway Commission "
                                    "(COSO) published its Internal Control — Integrated Framework to help "
                                    "organizations design and evaluate internal controls. Originally focused "
                                    "on financial reporting, the framework has proven adaptable to a wide "
                                    "range of operational and compliance objectives — including the "
                                    "governance of emerging technologies such as generative AI."
                                ),
                            ),
                            (
                                "callout",
                                {
                                    "title": "Key Concept",
                                    "body": p(
                                        "Generative AI refers to artificial intelligence systems capable of "
                                        "creating new content — text, images, code, audio, and video — based "
                                        "on patterns learned from training data. Examples include large "
                                        "language models (LLMs) like GPT-4, Claude, and Gemini."
                                    ),
                                    "variant": "info",
                                },
                            ),
                            (
                                "paragraph",
                                p(
                                    "As organizations adopt generative AI across functions — from customer "
                                    "service chatbots to automated document drafting — the need for "
                                    "structured internal controls becomes critical. Without appropriate "
                                    "governance, AI systems can introduce risks including:"
                                ),
                            ),
                            (
                                "bullet_list",
                                {
                                    "items": [
                                        "Inaccurate or misleading outputs (hallucinations)",
                                        "Bias in decision-making processes",
                                        "Unauthorized disclosure of sensitive data",
                                        "Regulatory and compliance violations",
                                        "Reputational damage from uncontrolled AI behavior",
                                    ],
                                },
                            ),
                            (
                                "paragraph",
                                p(
                                    "The COSO framework provides a structured, principle-based approach to "
                                    "addressing these risks through five interrelated components."
                                ),
                            ),
                        ],
                    },
                ),
                (
                    "section",
                    {
                        "title": "The Five Components of COSO",
                        "content": [
                            (
                                "paragraph",
                                p(
                                    "The COSO framework consists of five components that work together to "
                                    "support the achievement of an organization's objectives:"
                                ),
                            ),
                            (
                                "table",
                                {
                                    "headers": [
                                        "Component",
                                        "Description",
                                        "AI Governance Relevance",
                                    ],
                                    "rows": [
                                        [
                                            "Control Environment",
                                            "The set of standards, processes, and structures that provide the foundation for internal control across the organization",
                                            "Establishes the organizational tone for responsible AI use, including ethics policies, oversight structures, and accountability frameworks",
                                        ],
                                        [
                                            "Risk Assessment",
                                            "The process of identifying and analyzing risks to achieving objectives, forming the basis for how risks should be managed",
                                            "Identifies AI-specific risks including bias, hallucination, data leakage, model drift, and adversarial attacks",
                                        ],
                                        [
                                            "Control Activities",
                                            "Actions established through policies and procedures to mitigate risks to acceptable levels",
                                            "Implements technical and operational controls over AI model development, testing, deployment, and ongoing operations",
                                        ],
                                        [
                                            "Information & Communication",
                                            "Relevant, quality information is identified, captured, and communicated in a timely manner",
                                            "Ensures AI system transparency, explainability, and stakeholder communication about AI capabilities and limitations",
                                        ],
                                        [
                                            "Monitoring Activities",
                                            "Ongoing evaluations, separate evaluations, or some combination used to confirm controls are present and functioning",
                                            "Continuous monitoring of AI model performance, bias metrics, and control effectiveness",
                                        ],
                                    ],
                                },
                            ),
                            (
                                "warning",
                                {
                                    "title": "Important",
                                    "body": p(
                                        "The five COSO components are not sequential steps — they operate "
                                        "simultaneously and are interrelated. An organization cannot achieve "
                                        "effective internal control by addressing components in isolation."
                                    ),
                                },
                            ),
                        ],
                    },
                ),
                (
                    "section",
                    {
                        "title": "Control Environment for AI Governance",
                        "content": [
                            (
                                "paragraph",
                                p(
                                    "The control environment is the foundation of the entire internal "
                                    "control system. For AI governance, this means establishing:"
                                ),
                            ),
                            (
                                "bullet_list",
                                {
                                    "items": [
                                        "Board-level oversight of AI strategy and risk appetite",
                                        "Clear accountability structures for AI decisions and outcomes",
                                        "An organizational culture that values responsible AI development and use",
                                        "Policies that define acceptable and prohibited uses of generative AI",
                                        "Competency requirements for personnel involved in AI development and oversight",
                                    ],
                                },
                            ),
                            (
                                "example",
                                {
                                    "title": "Real-World Example",
                                    "body": p(
                                        "A financial services firm establishes an AI Ethics Committee, chaired "
                                        "by the Chief Risk Officer and reporting to the Board Risk Committee. "
                                        "The committee reviews all generative AI use cases before deployment, "
                                        "sets risk tolerance thresholds for model accuracy and bias, and "
                                        "conducts quarterly reviews of deployed AI systems. This structure "
                                        'demonstrates COSO Principle 2: "The board of directors demonstrates '
                                        'independence from management and exercises oversight of internal control."'
                                    ),
                                },
                            ),
                            (
                                "callout",
                                {
                                    "title": "Practice Tip",
                                    "body": p(
                                        "When evaluating an organization's AI control environment, assess "
                                        "whether AI governance is treated as a standalone initiative or "
                                        "integrated into existing enterprise risk management. Integrated "
                                        "approaches typically demonstrate stronger control environments."
                                    ),
                                    "variant": "tip",
                                },
                            ),
                            (
                                "paragraph",
                                p(
                                    "COSO identifies five principles related to the control environment. "
                                    "Each has direct application to AI governance:"
                                ),
                            ),
                            (
                                "table",
                                {
                                    "headers": ["COSO Principle", "AI Application"],
                                    "rows": [
                                        [
                                            "1. Commitment to integrity and ethical values",
                                            "AI ethics policies, responsible AI principles, prohibition of deceptive AI uses",
                                        ],
                                        [
                                            "2. Board exercises oversight",
                                            "Board-level AI governance committee, regular AI risk reporting to the board",
                                        ],
                                        [
                                            "3. Management establishes structure, authority, and responsibility",
                                            "AI Center of Excellence, clear roles for AI development, review, and deployment approval",
                                        ],
                                        [
                                            "4. Commitment to competence",
                                            "AI literacy training, specialized AI risk assessment skills, data science competency frameworks",
                                        ],
                                        [
                                            "5. Enforces accountability",
                                            "Individual accountability for AI system outcomes, performance metrics tied to responsible AI use",
                                        ],
                                    ],
                                },
                            ),
                        ],
                    },
                ),
            ],
        )
        course.add_child(instance=module)
        module.save_revision().publish()

        for text in [
            "Describe the five components of the COSO framework",
            "Explain how the control environment sets the tone for AI governance",
            "Identify board and management responsibilities in AI oversight",
        ]:
            ModuleLearningObjective.objects.create(module=module, text=text)

        return module

    # ---------------------------------------------------------------- module 2
    def _create_module_2(self, course: CoursePage) -> ModulePage:
        module = ModulePage(
            title="Module 2: Risk Assessment and Control Activities for Generative AI",
            slug="module-2",
            description=p(
                "This module examines how organizations identify, assess, and mitigate "
                "risks specific to generative AI systems through targeted control activities."
            ),
            sections=[
                (
                    "section",
                    {
                        "title": "AI Risk Identification and Analysis",
                        "content": [
                            (
                                "paragraph",
                                p(
                                    "Risk assessment under COSO requires organizations to identify events "
                                    "that could adversely affect their ability to achieve objectives, assess "
                                    "the likelihood and impact of those events, and determine how they "
                                    "should be managed. Generative AI introduces a unique risk profile that "
                                    "differs significantly from traditional IT systems."
                                ),
                            ),
                            (
                                "callout",
                                {
                                    "title": "Key Distinction",
                                    "body": p(
                                        "Unlike deterministic software systems that produce predictable "
                                        "outputs for given inputs, generative AI systems are probabilistic — "
                                        "they may produce different outputs for the same input. This "
                                        "non-deterministic nature fundamentally changes how risk must be "
                                        "assessed and controlled."
                                    ),
                                    "variant": "important",
                                },
                            ),
                            (
                                "paragraph",
                                p(
                                    "Organizations must assess the following categories of AI-specific risk:"
                                ),
                            ),
                            (
                                "table",
                                {
                                    "headers": ["Risk Category", "Description", "Example"],
                                    "rows": [
                                        [
                                            "Output Accuracy (Hallucination)",
                                            "AI generates plausible but factually incorrect content",
                                            "An AI assistant provides a client with fabricated regulatory citations in a compliance memo",
                                        ],
                                        [
                                            "Bias and Fairness",
                                            "AI outputs reflect or amplify biases present in training data",
                                            "A hiring AI disproportionately screens out candidates from certain demographic groups",
                                        ],
                                        [
                                            "Data Privacy and Confidentiality",
                                            "Sensitive information is exposed through AI interactions",
                                            "An employee pastes confidential client data into a public AI chatbot, which may be used for training",
                                        ],
                                        [
                                            "Model Drift",
                                            "AI performance degrades over time as real-world conditions change",
                                            "A fraud detection model trained on pre-pandemic data fails to recognize new fraud patterns",
                                        ],
                                        [
                                            "Adversarial Manipulation",
                                            "Bad actors exploit AI vulnerabilities through crafted inputs",
                                            "A prompt injection attack causes an AI customer service bot to override its safety guidelines",
                                        ],
                                        [
                                            "Intellectual Property",
                                            "AI generates content that infringes on existing intellectual property",
                                            "An AI system generates marketing copy substantially similar to copyrighted material",
                                        ],
                                        [
                                            "Regulatory Non-Compliance",
                                            "AI use violates existing or emerging regulations",
                                            "An organization deploys AI in a jurisdiction with AI-specific legislation without conducting required impact assessments",
                                        ],
                                    ],
                                },
                            ),
                            (
                                "warning",
                                {
                                    "title": "Audit Consideration",
                                    "body": p(
                                        "When assessing AI risk, practitioners should evaluate both the "
                                        "inherent risk of the AI system and the residual risk after controls "
                                        "are applied. The gap between inherent and residual risk represents "
                                        "the effectiveness of the control structure."
                                    ),
                                },
                            ),
                        ],
                    },
                ),
                (
                    "section",
                    {
                        "title": "Risk Assessment Process for AI",
                        "content": [
                            (
                                "paragraph",
                                p(
                                    'COSO Principle 7 states: "The organization identifies risks to the '
                                    "achievement of its objectives across the entity and analyzes risks as "
                                    'a basis for determining how the risks should be managed." For '
                                    "generative AI, this process should follow a structured methodology:"
                                ),
                            ),
                            (
                                "bullet_list",
                                {
                                    "items": [
                                        "Step 1: Inventory all generative AI systems and use cases across the organization",
                                        "Step 2: Classify each use case by risk tier (critical, high, medium, low) based on potential impact",
                                        "Step 3: For each use case, identify specific risks from the risk categories above",
                                        "Step 4: Assess likelihood and impact of each identified risk",
                                        "Step 5: Evaluate existing controls and determine residual risk",
                                        "Step 6: Determine risk response — accept, mitigate, transfer, or avoid",
                                    ],
                                },
                            ),
                            (
                                "example",
                                {
                                    "title": "Risk Classification Example",
                                    "body": p(
                                        "Critical Risk Tier: AI systems that make or directly influence "
                                        "decisions affecting financial reporting, client outcomes, or "
                                        "regulatory compliance. These require the highest level of control, "
                                        "including human-in-the-loop review for all outputs.<br><br>"
                                        "High Risk Tier: AI systems used in client-facing communications or "
                                        "internal decision support. These require automated quality controls "
                                        "and periodic human review.<br><br>"
                                        "Medium Risk Tier: AI tools used for internal productivity (e.g., "
                                        "email drafting, meeting summaries). These require usage policies "
                                        "and monitoring.<br><br>"
                                        "Low Risk Tier: AI tools used for non-sensitive exploration or "
                                        "learning. These require basic acceptable use policies."
                                    ),
                                },
                            ),
                            (
                                "callout",
                                {
                                    "title": "COSO Principle 8 — Fraud Risk",
                                    "body": p(
                                        "Organizations should specifically assess the risk of fraudulent use "
                                        "of AI, including the creation of deepfakes, generation of "
                                        "fraudulent documents, and manipulation of AI-generated financial "
                                        'analyses. This aligns with COSO Principle 8: "The organization '
                                        "considers the potential for fraud in assessing risks to the "
                                        'achievement of objectives."'
                                    ),
                                    "variant": "info",
                                },
                            ),
                        ],
                    },
                ),
                (
                    "section",
                    {
                        "title": "Designing Control Activities for AI",
                        "content": [
                            (
                                "paragraph",
                                p(
                                    "Control activities are the policies and procedures that help ensure "
                                    "management directives are carried out and risks are mitigated. COSO "
                                    'Principle 10 states: "The organization selects and develops control '
                                    "activities that contribute to the mitigation of risks to the "
                                    'achievement of objectives to acceptable levels."'
                                ),
                            ),
                            (
                                "paragraph",
                                p(
                                    "For generative AI, control activities span the entire AI lifecycle:"
                                ),
                            ),
                            (
                                "table",
                                {
                                    "headers": [
                                        "Lifecycle Stage",
                                        "Control Activity",
                                        "Description",
                                    ],
                                    "rows": [
                                        [
                                            "Development",
                                            "Training Data Governance",
                                            "Controls over data quality, representativeness, and bias detection in training datasets",
                                        ],
                                        [
                                            "Development",
                                            "Model Validation",
                                            "Independent testing and validation of model performance before deployment",
                                        ],
                                        [
                                            "Deployment",
                                            "Approval Gates",
                                            "Formal approval process with documented risk acceptance before production deployment",
                                        ],
                                        [
                                            "Deployment",
                                            "Access Controls",
                                            "Role-based access to AI systems with principle of least privilege",
                                        ],
                                        [
                                            "Operations",
                                            "Output Monitoring",
                                            "Real-time monitoring of AI outputs for quality, accuracy, and bias",
                                        ],
                                        [
                                            "Operations",
                                            "Human-in-the-Loop",
                                            "Required human review for high-risk or critical AI decisions",
                                        ],
                                        [
                                            "Operations",
                                            "Prompt Management",
                                            "Controlled system prompts with version control and change management",
                                        ],
                                        [
                                            "Retirement",
                                            "Model Deprecation",
                                            "Formal process for retiring models, including data retention and audit trail preservation",
                                        ],
                                    ],
                                },
                            ),
                            (
                                "example",
                                {
                                    "title": "Control Activity Example",
                                    "body": p(
                                        'An organization implements a "model card" requirement for every '
                                        "generative AI deployment. The model card documents: the intended "
                                        "use case, known limitations, bias evaluation results, training data "
                                        "sources, performance benchmarks, and the designated model owner. "
                                        "Model cards are reviewed quarterly and updated whenever the model "
                                        "is retrained or fine-tuned. This implements both COSO Principle 10 "
                                        "(control activities) and Principle 13 (relevant, quality information)."
                                    ),
                                },
                            ),
                            (
                                "warning",
                                {
                                    "title": "Common Pitfall",
                                    "body": p(
                                        "Organizations sometimes implement controls that are overly "
                                        "restrictive, effectively preventing beneficial AI use. Effective "
                                        "control design balances risk mitigation with enabling value "
                                        "creation. Controls should be proportionate to the assessed risk "
                                        "level of each AI use case."
                                    ),
                                },
                            ),
                        ],
                    },
                ),
            ],
        )
        course.add_child(instance=module)
        module.save_revision().publish()

        for text in [
            "Identify risks unique to generative AI systems",
            "Apply the COSO risk assessment process to AI-specific scenarios",
            "Design control activities to mitigate AI risks",
        ]:
            ModuleLearningObjective.objects.create(module=module, text=text)

        return module

    # ---------------------------------------------------------------- module 3
    def _create_module_3(self, course: CoursePage) -> ModulePage:
        module = ModulePage(
            title="Module 3: Information, Communication, and Monitoring for AI Systems",
            slug="module-3",
            description=p(
                "This module addresses how organizations ensure transparency, "
                "communication, and ongoing monitoring of AI controls to maintain "
                "effectiveness over time."
            ),
            sections=[
                (
                    "section",
                    {
                        "title": "Information and Communication for AI Systems",
                        "content": [
                            (
                                "paragraph",
                                p(
                                    'COSO Principle 13 states: "The organization obtains or generates and '
                                    "uses relevant, quality information to support the functioning of "
                                    'internal control." For generative AI systems, the information '
                                    "component addresses transparency, explainability, and the quality of "
                                    "data used in AI operations."
                                ),
                            ),
                            (
                                "paragraph",
                                p("Key information requirements for AI governance include:"),
                            ),
                            (
                                "table",
                                {
                                    "headers": ["Information Need", "Purpose", "Stakeholders"],
                                    "rows": [
                                        [
                                            "AI System Inventory",
                                            "Complete record of all AI systems, their purpose, risk tier, and current status",
                                            "Management, Board, Internal Audit, Regulators",
                                        ],
                                        [
                                            "Model Performance Metrics",
                                            "Accuracy, precision, recall, bias indicators, drift metrics",
                                            "AI Operations Team, Risk Management",
                                        ],
                                        [
                                            "Incident Reports",
                                            "Documentation of AI failures, near-misses, and corrective actions",
                                            "Management, Board Risk Committee, Compliance",
                                        ],
                                        [
                                            "Usage Analytics",
                                            "How AI systems are being used, by whom, and for what purposes",
                                            "AI Governance Committee, Compliance",
                                        ],
                                        [
                                            "Training Data Lineage",
                                            "Source, transformations, and quality assessments of training data",
                                            "AI Development Team, Internal Audit",
                                        ],
                                        [
                                            "Regulatory Landscape",
                                            "Current and emerging AI regulations applicable to the organization",
                                            "Legal, Compliance, Board",
                                        ],
                                    ],
                                },
                            ),
                            (
                                "callout",
                                {
                                    "title": "Explainability",
                                    "body": p(
                                        "COSO Principle 15 addresses external communication. For AI systems, "
                                        "this includes the ability to explain how AI-driven decisions are "
                                        'made. Many jurisdictions are enacting "right to explanation" '
                                        "provisions in AI legislation. Organizations should implement "
                                        "explainability mechanisms before regulatory requirements mandate them."
                                    ),
                                    "variant": "info",
                                },
                            ),
                            (
                                "example",
                                {
                                    "title": "Communication Framework Example",
                                    "body": p(
                                        "A professional services firm implements a tiered AI communication "
                                        "framework:<br><br>"
                                        "• Board Level: Quarterly AI governance dashboard showing risk heat "
                                        "map, incident summary, and compliance status<br>"
                                        "• Management Level: Monthly AI operations report with performance "
                                        "metrics, usage trends, and emerging risks<br>"
                                        "• Operational Level: Real-time AI monitoring dashboard with alerts "
                                        "for threshold breaches<br>"
                                        "• Client Level: Disclosure statements for any AI-assisted "
                                        "deliverables, including the scope of AI involvement and human "
                                        "review processes"
                                    ),
                                },
                            ),
                        ],
                    },
                ),
                (
                    "section",
                    {
                        "title": "Monitoring Activities for AI Controls",
                        "content": [
                            (
                                "paragraph",
                                p(
                                    'COSO Principle 16 states: "The organization selects, develops, and '
                                    "performs ongoing and/or separate evaluations to ascertain whether the "
                                    'components of internal control are present and functioning." AI '
                                    "systems require both continuous automated monitoring and periodic "
                                    "human evaluations."
                                ),
                            ),
                            (
                                "table",
                                {
                                    "headers": ["Monitoring Type", "Frequency", "Activities"],
                                    "rows": [
                                        [
                                            "Continuous Automated Monitoring",
                                            "Real-time",
                                            "Output quality scoring, bias detection algorithms, drift detection, usage pattern analysis, anomaly detection in AI behavior",
                                        ],
                                        [
                                            "Periodic Model Review",
                                            "Quarterly",
                                            "Model performance benchmarking, retraining assessment, training data review, security vulnerability assessment",
                                        ],
                                        [
                                            "Internal Audit Review",
                                            "Annually",
                                            "End-to-end AI control assessment, compliance with AI policies, effectiveness of governance structure, benchmark against standards and regulations",
                                        ],
                                        [
                                            "External Assessment",
                                            "As needed",
                                            "Independent AI ethics audit, regulatory examination response, third-party model validation",
                                        ],
                                    ],
                                },
                            ),
                            (
                                "warning",
                                {
                                    "title": "Critical Control",
                                    "body": p(
                                        "COSO Principle 17 requires that deficiencies be communicated to "
                                        "those responsible for corrective action. For AI systems, this means "
                                        "establishing clear escalation paths when monitoring detects:<br>"
                                        "• Model performance falling below defined thresholds<br>"
                                        "• Bias metrics exceeding acceptable ranges<br>"
                                        "• Unauthorized or policy-violating AI use<br>"
                                        "• Security vulnerabilities or data exposure events"
                                    ),
                                },
                            ),
                            (
                                "paragraph",
                                p(
                                    "Effective AI monitoring requires a combination of automated tooling "
                                    "and human judgment. Organizations should invest in:"
                                ),
                            ),
                            (
                                "bullet_list",
                                {
                                    "items": [
                                        "AI observability platforms that track model inputs, outputs, and performance over time",
                                        "Automated bias detection and fairness evaluation tools",
                                        "Anomaly detection systems for AI behavior patterns",
                                        "Structured human review processes for high-risk AI outputs",
                                        "Regular tabletop exercises simulating AI failure scenarios",
                                    ],
                                },
                            ),
                        ],
                    },
                ),
                (
                    "section",
                    {
                        "title": "Evaluating AI Control Effectiveness",
                        "content": [
                            (
                                "paragraph",
                                p(
                                    "An organization's AI internal control program should be evaluated "
                                    "holistically, considering all five COSO components. The following "
                                    "maturity model provides a framework for assessment:"
                                ),
                            ),
                            (
                                "table",
                                {
                                    "headers": ["Maturity Level", "Characteristics"],
                                    "rows": [
                                        [
                                            "Level 1: Ad Hoc",
                                            "No formal AI governance; individual departments adopt AI independently; controls are reactive and inconsistent",
                                        ],
                                        [
                                            "Level 2: Developing",
                                            "AI policy exists but is not consistently enforced; basic risk assessment performed; limited monitoring",
                                        ],
                                        [
                                            "Level 3: Defined",
                                            "Formal AI governance structure in place; risk assessment methodology established; control activities documented; regular monitoring performed",
                                        ],
                                        [
                                            "Level 4: Managed",
                                            "AI controls integrated into enterprise risk management; metrics-driven monitoring; regular reporting to board; continuous improvement process",
                                        ],
                                        [
                                            "Level 5: Optimized",
                                            "AI governance is proactive and anticipatory; controls adapt automatically based on risk signals; organization contributes to industry best practices; full regulatory alignment",
                                        ],
                                    ],
                                },
                            ),
                            (
                                "callout",
                                {
                                    "title": "Assessment Guidance",
                                    "body": p(
                                        "Most organizations today are at Level 1 or Level 2 maturity. The "
                                        "goal of applying the COSO framework is to provide a structured path "
                                        "to Level 3 and beyond. Practitioners should help organizations set "
                                        "realistic timelines for maturity progression, typically 12-18 "
                                        "months per level."
                                    ),
                                    "variant": "tip",
                                },
                            ),
                            (
                                "example",
                                {
                                    "title": "Comprehensive Assessment Example",
                                    "body": p(
                                        "An internal audit team evaluates an organization's AI control "
                                        "program using the following approach:<br><br>"
                                        "1. Control Environment: Review AI governance charter, committee "
                                        "meeting minutes, tone-at-the-top communications<br>"
                                        "2. Risk Assessment: Examine AI risk register, risk assessment "
                                        "methodology, risk response documentation<br>"
                                        "3. Control Activities: Test key controls through observation, "
                                        "inspection, and reperformance<br>"
                                        "4. Information &amp; Communication: Evaluate reporting completeness, "
                                        "timeliness, and stakeholder reach<br>"
                                        "5. Monitoring: Review monitoring procedures, deficiency tracking, "
                                        "and corrective action follow-up<br><br>"
                                        "Findings are mapped to specific COSO principles with "
                                        "recommendations for improvement."
                                    ),
                                },
                            ),
                        ],
                    },
                ),
            ],
        )
        course.add_child(instance=module)
        module.save_revision().publish()

        for text in [
            "Design information and communication processes for AI transparency",
            "Implement monitoring activities for AI system controls",
            "Evaluate the effectiveness of an AI internal control program",
        ]:
            ModuleLearningObjective.objects.create(module=module, text=text)

        return module

    # ----------------------------------------------------------------- reviews
    def _make_review(
        self,
        course: CoursePage,
        *,
        slug: str,
        title: str,
        questions: list[dict],
    ) -> ReviewPage:
        review = ReviewPage(title=title, slug=slug, intro=p("Quick knowledge check."))
        course.add_child(instance=review)
        review.save_revision().publish()

        for qdata in questions:
            q = ReviewQuestion.objects.create(
                review=review,
                text=p(qdata["question"]),
                correct_answer=qdata["correct"],
                feedback_correct=p(qdata["feedback_correct"]),
                feedback_incorrect=p(qdata["feedback_incorrect"]),
                explanation=p(qdata["explanation"]),
            )
            for key, text in qdata["options"]:
                ReviewQuestionOption.objects.create(question=q, key=key, text=text)

        return review

    def _create_review_1(self, course: CoursePage) -> ReviewPage:
        return self._make_review(
            course,
            slug="review-1",
            title="Review 1: Knowledge Check",
            questions=[
                {
                    "question": "Which of the following best describes the role of the control environment in AI governance?",
                    "options": [
                        ("a", "It provides the technical infrastructure for deploying AI models"),
                        (
                            "b",
                            "It establishes the organizational tone, oversight structures, and accountability for responsible AI use",
                        ),
                        ("c", "It monitors AI outputs for accuracy and bias on a real-time basis"),
                        (
                            "d",
                            "It focuses exclusively on regulatory compliance requirements for AI systems",
                        ),
                    ],
                    "correct": "b",
                    "feedback_correct": "Correct! The control environment establishes the foundation — including tone at the top, oversight structures, and accountability frameworks — upon which all other AI governance controls are built.",
                    "feedback_incorrect": "Not quite. The control environment is about the organizational foundation — tone, culture, oversight, and accountability — not technical infrastructure or specific monitoring activities.",
                    "explanation": "The control environment is the first component of the COSO framework and sets the foundation for all other internal control components. For AI governance, it encompasses the board's commitment to ethical AI, management structures for oversight, and accountability mechanisms.",
                },
                {
                    "question": "An AI Ethics Committee chaired by the Chief Risk Officer and reporting to the Board Risk Committee is an example of which COSO principle?",
                    "options": [
                        ("a", "Principle 1: Commitment to integrity and ethical values"),
                        (
                            "b",
                            "Principle 2: The board demonstrates independence and exercises oversight",
                        ),
                        ("c", "Principle 4: Commitment to competence"),
                        ("d", "Principle 5: Enforces accountability"),
                    ],
                    "correct": "b",
                    "feedback_correct": "Correct! An AI Ethics Committee with board-level reporting demonstrates Principle 2 — the board exercising independent oversight of internal control, specifically AI governance.",
                    "feedback_incorrect": "Think about which principle relates to board-level oversight and governance structures. The committee reports to the Board Risk Committee, demonstrating a specific type of organizational oversight.",
                    "explanation": "COSO Principle 2 states that the board of directors demonstrates independence from management and exercises oversight of the development and performance of internal control. An AI Ethics Committee with board reporting embodies this principle.",
                },
                {
                    "question": "Which of the following is NOT a characteristic of generative AI that distinguishes it from traditional software systems for control purposes?",
                    "options": [
                        (
                            "a",
                            "Generative AI systems are probabilistic and may produce different outputs for the same input",
                        ),
                        (
                            "b",
                            "Generative AI can produce plausible but factually incorrect outputs",
                        ),
                        (
                            "c",
                            "Generative AI systems always require internet connectivity to function",
                        ),
                        (
                            "d",
                            "Generative AI performance can degrade over time as real-world conditions change",
                        ),
                    ],
                    "correct": "c",
                    "feedback_correct": "Correct! Internet connectivity is not a distinguishing characteristic of generative AI for control purposes. Many AI models can run locally. The other options — probabilistic outputs, hallucination risk, and model drift — are genuine distinguishing characteristics.",
                    "feedback_incorrect": "Consider which option describes a technical infrastructure requirement rather than a fundamental characteristic that affects how we design controls for AI systems.",
                    "explanation": "Generative AI is distinguished for control purposes by its probabilistic nature, potential for hallucination, and susceptibility to model drift. Internet connectivity is an infrastructure consideration, not a distinguishing governance characteristic.",
                },
            ],
        )

    def _create_review_2(self, course: CoursePage) -> ReviewPage:
        return self._make_review(
            course,
            slug="review-2",
            title="Review 2: Knowledge Check",
            questions=[
                {
                    "question": "When classifying AI use cases by risk tier, which factor is MOST important in determining whether a use case is 'Critical' risk?",
                    "options": [
                        ("a", "The cost of the AI system implementation"),
                        (
                            "b",
                            "Whether the AI system makes or directly influences decisions affecting financial reporting, client outcomes, or regulatory compliance",
                        ),
                        ("c", "The number of users who interact with the AI system"),
                        ("d", "Whether the AI system was developed in-house or by a third party"),
                    ],
                    "correct": "b",
                    "feedback_correct": "Correct! The critical risk tier is defined by the potential impact on financial reporting, client outcomes, or regulatory compliance — areas where errors could have severe consequences.",
                    "feedback_incorrect": "Risk classification should focus on the potential impact of AI decisions, not on cost, user count, or development source. Consider what makes an AI failure most consequential.",
                    "explanation": "Critical risk AI use cases are those where AI decisions directly affect financial reporting, client outcomes, or regulatory compliance. These require the highest level of controls including mandatory human-in-the-loop review.",
                },
                {
                    "question": "Which control activity addresses the risk of AI model performance degrading over time?",
                    "options": [
                        ("a", "Access controls with principle of least privilege"),
                        ("b", "Formal approval gates before production deployment"),
                        ("c", "Output monitoring with drift detection metrics"),
                        ("d", "Training data governance and bias detection"),
                    ],
                    "correct": "c",
                    "feedback_correct": "Correct! Output monitoring with drift detection directly addresses model drift — the degradation of AI performance over time as real-world conditions change from those in the training data.",
                    "feedback_incorrect": "Consider which control specifically targets the detection and measurement of changing model performance over time. Model drift is an operational concern that requires ongoing monitoring.",
                    "explanation": "Model drift occurs when AI performance degrades because real-world conditions differ from training data conditions. Output monitoring with drift detection metrics is the specific control activity that identifies and addresses this risk.",
                },
                {
                    "question": "A 'model card' requirement for AI deployments primarily implements which COSO principles?",
                    "options": [
                        ("a", "Principle 1 (Integrity) and Principle 5 (Accountability)"),
                        ("b", "Principle 8 (Fraud Risk) and Principle 9 (Significant Change)"),
                        (
                            "c",
                            "Principle 10 (Control Activities) and Principle 13 (Relevant Quality Information)",
                        ),
                        (
                            "d",
                            "Principle 16 (Ongoing Evaluations) and Principle 17 (Deficiency Communication)",
                        ),
                    ],
                    "correct": "c",
                    "feedback_correct": "Correct! Model cards serve as both a control activity (Principle 10) — documenting intended use, limitations, and bias evaluations — and as relevant, quality information (Principle 13) that supports ongoing governance decisions.",
                    "feedback_incorrect": "Model cards document the intended use, limitations, bias evaluations, and performance benchmarks of AI models. Think about which principles relate to documented controls and quality information.",
                    "explanation": "Model cards implement Principle 10 by establishing a documented control procedure for AI deployments, and Principle 13 by generating and maintaining relevant, quality information about each AI system.",
                },
            ],
        )

    def _create_review_3(self, course: CoursePage) -> ReviewPage:
        return self._make_review(
            course,
            slug="review-3",
            title="Review 3: Knowledge Check",
            questions=[
                {
                    "question": "Under COSO Principle 13, which of the following is the MOST comprehensive information requirement for AI governance?",
                    "options": [
                        (
                            "a",
                            "A complete AI system inventory including purpose, risk tier, and current status",
                        ),
                        ("b", "Monthly financial reports showing AI system costs"),
                        ("c", "Employee satisfaction surveys about AI tool usability"),
                        ("d", "Vendor marketing materials about AI capabilities"),
                    ],
                    "correct": "a",
                    "feedback_correct": "Correct! A comprehensive AI system inventory is the foundation of AI information requirements. It provides management, the board, internal audit, and regulators with the visibility needed to govern AI effectively.",
                    "feedback_incorrect": "Consider which information source provides the broadest and most relevant basis for AI governance decisions across multiple stakeholder groups.",
                    "explanation": "COSO Principle 13 requires relevant, quality information to support internal control. An AI system inventory provides the comprehensive baseline needed for all governance activities.",
                },
                {
                    "question": "What type of monitoring combines real-time automated detection with quarterly human review?",
                    "options": [
                        ("a", "Continuous monitoring only"),
                        (
                            "b",
                            "A combination of ongoing evaluations and separate evaluations as described in COSO Principle 16",
                        ),
                        ("c", "External audit procedures"),
                        ("d", "Management override testing"),
                    ],
                    "correct": "b",
                    "feedback_correct": "Correct! COSO Principle 16 explicitly calls for ongoing evaluations (continuous automated monitoring) and/or separate evaluations (periodic human review) to confirm controls are functioning.",
                    "feedback_incorrect": "COSO distinguishes between ongoing evaluations (continuous) and separate evaluations (periodic). The correct answer combines both approaches as recommended by the framework.",
                    "explanation": "COSO Principle 16 recommends a combination of ongoing evaluations (real-time automated monitoring) and separate evaluations (periodic reviews) to provide comprehensive assurance that controls are present and functioning.",
                },
                {
                    "question": "An organization at 'Level 3: Defined' maturity in AI governance has which of the following characteristics?",
                    "options": [
                        (
                            "a",
                            "No formal AI governance with individual departments adopting AI independently",
                        ),
                        (
                            "b",
                            "AI controls integrated into enterprise risk management with metrics-driven monitoring",
                        ),
                        (
                            "c",
                            "Formal AI governance structure, established risk assessment methodology, documented controls, and regular monitoring",
                        ),
                        (
                            "d",
                            "Proactive and anticipatory governance with controls that adapt automatically",
                        ),
                    ],
                    "correct": "c",
                    "feedback_correct": "Correct! Level 3: Defined is characterized by formalized governance structures, established methodologies, documented control activities, and regular monitoring processes.",
                    "feedback_incorrect": "Review the maturity model levels. Level 3 represents formalization — where governance structures, methodologies, and monitoring processes are established and documented.",
                    "explanation": "Level 3: Defined maturity means the organization has moved beyond ad hoc and developing stages to establish formal governance structures, documented risk assessment methodologies, defined control activities, and regular monitoring practices.",
                },
            ],
        )

    # -------------------------------------------------------------- assessment
    def _create_assessment(self, course: CoursePage) -> AssessmentPage:
        assessment = AssessmentPage(
            title="Final Assessment",
            slug="assessment",
            intro=p("Answer all 15 questions. You must score 70% or higher (11/15) to pass."),
            time_limit_minutes=30,
        )
        course.add_child(instance=assessment)
        assessment.save_revision().publish()

        questions: list[dict] = [
            {
                "question": "Which COSO component establishes the organizational tone for responsible AI use and includes oversight structures and accountability frameworks?",
                "options": [
                    ("a", "Risk Assessment"),
                    ("b", "Control Environment"),
                    ("c", "Monitoring Activities"),
                    ("d", "Information and Communication"),
                ],
                "correct": "b",
                "explanation": "The control environment is the foundation of the COSO framework, establishing the tone, oversight structures, and accountability that underpin all other components of AI governance.",
                "module_reference": "Module 1",
            },
            {
                "question": "An organization requires all AI-generated client deliverables to be reviewed by a qualified professional before delivery. This is an example of which control activity?",
                "options": [
                    ("a", "Access controls"),
                    ("b", "Human-in-the-loop review"),
                    ("c", "Output monitoring"),
                    ("d", "Prompt management"),
                ],
                "correct": "b",
                "explanation": "Human-in-the-loop review requires human verification of AI outputs before they are acted upon, particularly important for high-risk and critical decisions.",
                "module_reference": "Module 2",
            },
            {
                "question": "What distinguishes generative AI from deterministic software systems for the purpose of internal control design?",
                "options": [
                    ("a", "Generative AI is always more expensive to operate"),
                    (
                        "b",
                        "Generative AI is probabilistic and may produce different outputs for the same input",
                    ),
                    ("c", "Generative AI cannot be deployed on-premises"),
                    ("d", "Generative AI requires no human oversight"),
                ],
                "correct": "b",
                "explanation": "The probabilistic nature of generative AI — producing potentially different outputs for identical inputs — fundamentally changes how organizations must design and implement internal controls.",
                "module_reference": "Module 1",
            },
            {
                "question": "COSO Principle 8 regarding fraud risk requires organizations to assess which of the following in the context of AI?",
                "options": [
                    (
                        "a",
                        "The risk of AI systems being used fraudulently, including deepfakes and fabricated documents",
                    ),
                    ("b", "The risk of AI vendors committing financial fraud"),
                    ("c", "The risk of employees using AI to avoid doing work"),
                    ("d", "The risk of AI systems becoming sentient"),
                ],
                "correct": "a",
                "explanation": "COSO Principle 8 requires assessing fraud risk, which for AI includes the potential for creating deepfakes, generating fraudulent documents, and manipulating AI-generated financial analyses.",
                "module_reference": "Module 2",
            },
            {
                "question": "Which of the following represents the correct sequence for the AI risk assessment process?",
                "options": [
                    ("a", "Classify risk → Inventory systems → Identify risks → Assess impact"),
                    (
                        "b",
                        "Inventory systems → Classify by risk tier → Identify specific risks → Assess likelihood and impact → Evaluate controls → Determine risk response",
                    ),
                    (
                        "c",
                        "Deploy controls → Identify risks → Monitor effectiveness → Report results",
                    ),
                    ("d", "Assess impact → Identify risks → Classify risk → Inventory systems"),
                ],
                "correct": "b",
                "explanation": "The structured risk assessment process begins with inventorying all AI systems, then classifying by risk tier, identifying specific risks, assessing likelihood and impact, evaluating existing controls, and determining risk responses.",
                "module_reference": "Module 2",
            },
            {
                "question": "A tiered AI communication framework with board-level dashboards, management-level reports, and operational-level monitoring addresses which COSO component?",
                "options": [
                    ("a", "Control Environment"),
                    ("b", "Risk Assessment"),
                    ("c", "Control Activities"),
                    ("d", "Information and Communication"),
                ],
                "correct": "d",
                "explanation": "Information and Communication (COSO Principles 13-15) addresses how relevant information is captured and communicated to appropriate stakeholders at appropriate levels.",
                "module_reference": "Module 3",
            },
            {
                "question": "Training data governance as a control activity primarily addresses which phase of the AI lifecycle?",
                "options": [
                    ("a", "Deployment"),
                    ("b", "Development"),
                    ("c", "Operations"),
                    ("d", "Retirement"),
                ],
                "correct": "b",
                "explanation": "Training data governance — including controls over data quality, representativeness, and bias detection — is a development-phase control activity that establishes the foundation for model quality.",
                "module_reference": "Module 2",
            },
            {
                "question": "An organization at Level 4: Managed maturity in AI governance would be characterized by:",
                "options": [
                    ("a", "No formal AI governance with ad hoc controls"),
                    ("b", "AI policy exists but is not consistently enforced"),
                    (
                        "c",
                        "AI controls integrated into enterprise risk management with metrics-driven monitoring and regular board reporting",
                    ),
                    (
                        "d",
                        "Proactive governance with controls that adapt automatically based on risk signals",
                    ),
                ],
                "correct": "c",
                "explanation": "Level 4: Managed maturity is characterized by integration of AI controls into enterprise risk management, metrics-driven monitoring, regular board reporting, and continuous improvement processes.",
                "module_reference": "Module 3",
            },
            {
                "question": "COSO Principle 17 requires that AI control deficiencies be:",
                "options": [
                    ("a", "Hidden from external regulators to protect competitive advantage"),
                    (
                        "b",
                        "Communicated in a timely manner to those responsible for corrective action",
                    ),
                    ("c", "Addressed only during annual audit cycles"),
                    ("d", "Documented but not acted upon until the next budget cycle"),
                ],
                "correct": "b",
                "explanation": "COSO Principle 17 requires that internal control deficiencies be evaluated and communicated in a timely manner to parties responsible for taking corrective action, including senior management and the board as appropriate.",
                "module_reference": "Module 3",
            },
            {
                "question": "An employee pastes confidential client data into a public AI chatbot. This scenario represents which category of AI risk?",
                "options": [
                    ("a", "Model Drift"),
                    ("b", "Adversarial Manipulation"),
                    ("c", "Data Privacy and Confidentiality"),
                    ("d", "Output Accuracy"),
                ],
                "correct": "c",
                "explanation": "This scenario represents a data privacy and confidentiality risk — sensitive information being exposed through AI interactions, potentially becoming part of the AI's training data.",
                "module_reference": "Module 2",
            },
            {
                "question": "Which monitoring approach does COSO Principle 16 specifically recommend for assessing whether internal controls over AI are present and functioning?",
                "options": [
                    ("a", "Annual external audit only"),
                    ("b", "Continuous automated monitoring only"),
                    ("c", "A combination of ongoing evaluations and separate evaluations"),
                    ("d", "Periodic management self-assessment only"),
                ],
                "correct": "c",
                "explanation": "COSO Principle 16 recommends ongoing evaluations (continuous automated monitoring) and/or separate evaluations (periodic human review) to provide comprehensive assurance.",
                "module_reference": "Module 3",
            },
            {
                "question": "The 'right to explanation' requirement in emerging AI legislation most directly relates to which COSO principle?",
                "options": [
                    ("a", "Principle 5: Enforces accountability"),
                    ("b", "Principle 10: Selects and develops control activities"),
                    ("c", "Principle 15: Communicates externally"),
                    ("d", "Principle 16: Conducts ongoing and/or separate evaluations"),
                ],
                "correct": "c",
                "explanation": "COSO Principle 15 addresses external communication, including the ability to explain AI-driven decisions to external stakeholders, which directly aligns with 'right to explanation' requirements.",
                "module_reference": "Module 3",
            },
            {
                "question": "When evaluating an organization's AI control environment, which approach typically demonstrates a STRONGER control environment?",
                "options": [
                    (
                        "a",
                        "Treating AI governance as a standalone initiative separate from enterprise risk management",
                    ),
                    (
                        "b",
                        "Integrating AI governance into existing enterprise risk management frameworks",
                    ),
                    ("c", "Delegating all AI governance to the IT department"),
                    ("d", "Relying on AI vendors to manage governance for the organization"),
                ],
                "correct": "b",
                "explanation": "Integrated approaches — where AI governance is embedded within existing enterprise risk management — typically demonstrate stronger control environments than standalone or siloed approaches.",
                "module_reference": "Module 1",
            },
            {
                "question": "A prompt injection attack that causes an AI customer service bot to override its safety guidelines is an example of which AI risk category?",
                "options": [
                    ("a", "Bias and Fairness"),
                    ("b", "Output Accuracy"),
                    ("c", "Intellectual Property"),
                    ("d", "Adversarial Manipulation"),
                ],
                "correct": "d",
                "explanation": "Adversarial manipulation involves bad actors exploiting AI vulnerabilities through crafted inputs (such as prompt injection) to cause the AI to behave in unintended ways.",
                "module_reference": "Module 2",
            },
            {
                "question": "Which of the following BEST describes why the five COSO components should not be implemented sequentially for AI governance?",
                "options": [
                    ("a", "Sequential implementation is too expensive for most organizations"),
                    (
                        "b",
                        "The components operate simultaneously and are interrelated — effective control requires all five working together",
                    ),
                    ("c", "AI technology changes too fast for sequential implementation"),
                    ("d", "Regulators require all components to be implemented at the same time"),
                ],
                "correct": "b",
                "explanation": "The COSO framework emphasizes that its five components are interrelated and operate simultaneously. An organization cannot achieve effective internal control by addressing components in isolation or sequentially.",
                "module_reference": "Module 1",
            },
        ]

        for qdata in questions:
            q = AssessmentQuestion.objects.create(
                assessment=assessment,
                text=p(qdata["question"]),
                correct_answer=qdata["correct"],
                explanation=p(qdata["explanation"]),
                module_reference=qdata["module_reference"],
            )
            for key, text in qdata["options"]:
                AssessmentQuestionOption.objects.create(question=q, key=key, text=text)

        return assessment

    # -------------------------------------------------------------- evaluation
    def _create_evaluation(self, course: CoursePage) -> EvaluationPage:
        evaluation = EvaluationPage(
            title="Course Evaluation",
            slug="evaluation",
            intro=p("Help us improve. Your responses are confidential."),
        )
        course.add_child(instance=evaluation)
        evaluation.save_revision().publish()

        for text, qtype in [
            ("The stated learning objectives were met.", "likert"),
            ("The course content was relevant to my professional development.", "likert"),
            ("The course materials were clearly presented and well-organized.", "likert"),
            (
                "The time required to complete the course was appropriate for the content covered.",
                "likert",
            ),
            (
                "Please provide any additional comments or suggestions for improving this course.",
                "text",
            ),
        ]:
            EvaluationQuestion.objects.create(evaluation=evaluation, text=text, question_type=qtype)

        return evaluation
