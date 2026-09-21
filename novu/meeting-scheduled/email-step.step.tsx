import { step } from '@novu/framework/step-resolver';

export default step.email(
  'email-step',
  async (_controls, { payload, subscriber }) => ({
    subject: payload.subject ?? 'Crab Learn meeting scheduled',
    body: `Hi ${subscriber.firstName ?? 'there'},\n\n${payload.message ?? 'Your Crab Learn meeting has been scheduled.'}`,
  }),
  {
    controlSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    } as const,
  }
);