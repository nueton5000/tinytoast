import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any user authenticated via an API key can "create", "read",
"update", and "delete" any "Todo" records.
=========================================================================*/
const schema = a.schema({
  Profile: a
    .model({
      id: a.id(),
      userId: a.id()
        .authorization((allow) => allow.owner()),
      nickname: a.string().required(),
      receivedFeedback: a.hasMany('Feedback', 'toProfileId')
        .authorization((allow) => allow.owner()),
      providedFeedback: a.hasMany('Feedback', 'fromProfileId')
        .authorization((allow) => allow.owner()),
      resumeId: a.id(),
      resume: a.hasOne('Resume', 'profileId')
        .authorization((allow) => allow.owner()),
      // Subscription fields
      stripeCustomerId: a.string(),
      subscriptionTier: a.enum(['FREE', 'BASIC', 'PREMIUM']),
      subscriptionStatus: a.enum(['ACTIVE', 'CANCELLED', 'PAST_DUE', 'NONE']),
      subscriptionExpiresAt: a.datetime(),
      // Ideas created by this profile
      ideas: a.hasMany('Idea', 'ownerProfileId'),
      // Ideas joined by this profile
      joinedIdeas: a.hasMany('IdeaMember', 'profileId'),
    })
    .identifier(['id'])
    .secondaryIndexes((index) => [
      index('nickname')
    ])
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['get']),
      allow.guest().to(['read'])
    ]),
  // Ideas/Projects for local teams platform
  Idea: a
    .model({
      id: a.id(),
      title: a.string().required(),
      description: a.string().required(),
      shortDescription: a.string(), // 100-150 char preview
      skillsNeeded: a.string().array(), // Array of skills
      maxParticipants: a.integer().required(),
      currentParticipants: a.integer().default(0),
      status: a.enum(['DRAFT', 'ACTIVE', 'FULL', 'COMPLETED', 'ARCHIVED']),
      isFeatured: a.boolean().default(false),
      impactArea: a.string(), // e.g., "Environment", "Education", "Health"
      location: a.string(), // City or region
      ownerProfileId: a.id().required(),
      ownerProfile: a.belongsTo('Profile', 'ownerProfileId'),
      members: a.hasMany('IdeaMember', 'ideaId'),
    })
    .identifier(['id'])
    .secondaryIndexes((index) => [
      index('status'),
      index('ownerProfileId')
    ])
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read']),
      allow.guest().to(['read'])
    ]),
  // Junction table for idea members
  IdeaMember: a
    .model({
      id: a.id(),
      ideaId: a.id().required(),
      idea: a.belongsTo('Idea', 'ideaId'),
      profileId: a.id().required(),
      profile: a.belongsTo('Profile', 'profileId'),
      role: a.enum(['OWNER', 'MEMBER']),
      joinedAt: a.datetime(),
      status: a.enum(['PENDING', 'APPROVED', 'REJECTED']),
    })
    .identifier(['id'])
    .secondaryIndexes((index) => [
      index('ideaId'),
      index('profileId')
    ])
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read', 'create']),
    ]),
  Resume: a
    .model({
      name: a.string(),
      profileId: a.id(),
      profile: a.belongsTo('Profile', 'profileId'),
      versions: a.hasMany('ResumeVersion', 'resumeId'),
      feedbacks: a.hasMany('ResumeFeedback', 'resumeId'),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['get']),
      allow.guest().to(['read'])
    ]),
  ResumeVersion: a
    .model({
      resumeId: a.id(),
      resume: a.belongsTo('Resume', 'resumeId'),
      content: a.string(),
      version: a.integer().default(1),
      isPublished: a.boolean().default(false),
      publishedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['get']),
      allow.guest().to(['read'])
    ]),
  ResumeFeedback: a
    .model({
      resumeId: a.id(),
      resume: a.belongsTo('Resume', 'resumeId'),
      feedbackId: a.id(),
      feedback: a.belongsTo('Feedback', 'feedbackId')
    })
    .authorization((allow) => allow.owner()),
  Feedback: a
    .model({
      id: a.id(),
      content: a.string(),

      fromProfileId: a.id(),
      fromProfile: a.belongsTo('Profile', 'fromProfileId'),

      toProfileId: a.id().required(),
      toProfile: a.belongsTo('Profile', 'toProfileId'),

      questionText: a.string(),
      conversationId: a.string(),

      resumes: a.hasMany('ResumeFeedback', 'feedbackId')
    })
    .authorization((allow) => [
      allow.authenticated().to(['create']),
      allow.ownerDefinedIn('toProfileId')
    ]),
  ProfileDailyViewMetric: a
    .model({
      profileId: a.id().required(),
      date: a.date().required(),
      viewCount: a.integer().default(0)
    })
    .identifier(['profileId', 'date'])
    .authorization((allow) => [
      allow.ownerDefinedIn('profileId').to(['get', 'list']),
      allow.publicApiKey().to(['read'])
    ]),
  FeedbackTotalViewMetric: a
    .model({
      profileId: a.id().required(),
      feedbackId: a.id().required(),
      viewCount: a.integer().default(0)
    })
    .identifier(['profileId', 'feedbackId'])
    .authorization((allow) => [
      allow.ownerDefinedIn('profileId').to(['get', 'list']),
      allow.publicApiKey().to(['read'])
    ]),
// AI generation route for improving resumes
  improveResume: a
    .generation({
      aiModel: a.ai.model('Amazon Nova Lite'),
      systemPrompt: `You are an expert career coach helping users improve their resumes by incorporating feedback about the person.

You will receive:
1. The current resume in markdown format
2. Feedback about the person (NOT feedback about the resume itself) - formatted as Question/Response pairs where people share insights about this person's skills, strengths, work style, achievements, and personality
3. Optional additional instructions

Your task:
1. Carefully read the current resume
2. Extract insights about the person from the feedback responses:
   - Skills and expertise mentioned
   - Specific achievements or projects discussed
   - Personality traits and work style characteristics
   - Strengths and capabilities highlighted
   - Leadership or teamwork qualities noted
   - Any concrete examples or accomplishments shared
3. Incorporate these insights into the resume by:
   - Adding new skills or strengthening existing skill descriptions
   - Including specific achievements and accomplishments mentioned in feedback
   - Enhancing job descriptions with traits and capabilities people noted
   - Adding a professional summary or strengthening it with personality insights
   - Making the resume better reflect who this person actually is based on others' perspectives
4. Apply any additional instructions provided
5. Return ONLY the complete improved resume in markdown format
6. Do NOT include explanations, commentary, or meta-text
7. Do NOT wrap the response in markdown code blocks
8. Preserve the overall structure and professional style

IMPORTANT: The feedback is about the PERSON, not critiques of the resume. Use the feedback to make the resume better represent this person's actual skills, achievements, and professional identity.`,
      inferenceConfiguration: {
        maxTokens: 3000,
        temperature: 0.7,
      },
    })
    .arguments({
      content: a.string()
    })
    .returns(a.customType({
      resumeContent: a.string()
    }))
    .authorization((allow) => allow.authenticated()),

  // AI generation for collecting feedback from public profile visitors
  collectFeedback: a
    .generation({
      aiModel: a.ai.model('Amazon Nova Lite'),
      systemPrompt: `You are an intelligent career coach conducting a thoughtful feedback interview. Your goal is to gather valuable insights about a person to help improve their resume. You're collecting feedback ABOUT THE PERSON themselves - their skills, work style, achievements, and personality - not critiques of their resume.

Your approach:
1. Review the resume content provided to understand their background
2. If this is the first question (no conversation history), ask an open-ended question to understand how the reviewer knows this person or what they've observed about their work
3. For follow-up questions, analyze previous answers and ask increasingly specific questions that uncover:
   - Specific skills and expertise they've demonstrated
   - Concrete achievements or projects they've accomplished
   - Their work style, personality traits, and professional strengths
   - Leadership qualities, teamwork abilities, or unique capabilities
   - Specific examples and stories that showcase their abilities
4. Keep the conversation natural and conversational
5. Don't ask more than 5-6 questions total - quality over quantity

Guidelines:
- Acknowledge what they said in previous responses
- Ask follow-up questions that dig deeper into skills, achievements, or traits mentioned
- Focus on getting specific, concrete examples rather than general observations
- After 5-6 quality questions, or when you have comprehensive feedback about the person, set isComplete to true
- Keep responses brief and conversational

Return your response as a JSON object with:
- question: The next question to ask (or a thank you message if complete)
- isComplete: true if feedback collection is done, false otherwise`,
      inferenceConfiguration: {
        maxTokens: 500,
        temperature: 0.7,
      },
    })
    .arguments({
      resumeContent: a.string(),
      conversationHistory: a.string()
    })
    .returns(a.customType({
      question: a.string(),
      isComplete: a.boolean()
    }))
    .authorization((allow) => allow.authenticated()),

  // Custom mutation to increment profile daily view count
  incrementProfileView: a
    .mutation()
    .arguments({
      profileId: a.id().required()
    })
    .returns(a.customType({
      success: a.boolean(),
      viewCount: a.integer()
    }))
    .handler(a.handler.custom({
      dataSource: a.ref('ProfileDailyViewMetric'),
      entry: './resolvers/incrementProfileView.js'
    }))
    .authorization((allow) => allow.publicApiKey()),

  // Custom mutation to increment feedback total view count
  incrementFeedbackView: a
    .mutation()
    .arguments({
      profileId: a.id().required(),
      feedbackId: a.id().required()
    })
    .returns(a.customType({
      success: a.boolean(),
      viewCount: a.integer()
    }))
    .handler(a.handler.custom({
      dataSource: a.ref('FeedbackTotalViewMetric'),
      entry: './resolvers/incrementFeedbackView.js'
    }))
    .authorization((allow) => allow.publicApiKey()),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
