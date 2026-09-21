import { step } from '@novu/framework/step-resolver';

export default step.email(
  'email-step',
  async (_controls, { payload, subscriber }) => ({
    subject: payload.subject ?? 'Crab Learn password verification code',
    body: `Hi ${subscriber.firstName ?? 'there'},\n\n${payload.message ?? 'Your password verification code is ready.'}`,
  }),
  {
    controlSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    } as const,
  }
);
