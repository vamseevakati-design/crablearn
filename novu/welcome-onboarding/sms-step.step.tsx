import { step } from '@novu/framework/step-resolver';

export default step.sms(
  'sms-step',
  async (controls, { payload, subscriber }) => ({
    body: `Hi ${subscriber.firstName ?? 'there'}, ${controls.message}`,
  }),
  {
    controlSchema: {
      type: 'object',
      properties: {
        message: { type: 'string', default: 'You have a new notification. Reply STOP to unsubscribe.' },
      },
      additionalProperties: false,
    } as const,
    // skip: (_controls, { subscriber }) => !subscriber.phone,
  }
);
