import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.text();
  const body = JSON.parse(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400,
    });
  }

  const supabase = createClient();

  // Handle the webhook
  switch (evt.type) {
    case 'user.created':
      try {
        const { data, error } = await supabase
          .from('users')
          .insert({
            clerk_user_id: evt.data.id,
            email: evt.data.email_addresses[0]?.email_address || '',
            subscription_tier: 'free',
            usage_count: 0,
          });

        if (error) {
          console.error('Error creating user in Supabase:', error);
          return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
        }

        console.log('User created successfully:', evt.data.id);
      } catch (error) {
        console.error('Error handling user.created webhook:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
      break;

    case 'user.updated':
      try {
        const { error } = await supabase
          .from('users')
          .update({
            email: evt.data.email_addresses[0]?.email_address || '',
            updated_at: new Date().toISOString(),
          })
          .eq('clerk_user_id', evt.data.id);

        if (error) {
          console.error('Error updating user in Supabase:', error);
          return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
        }

        console.log('User updated successfully:', evt.data.id);
      } catch (error) {
        console.error('Error handling user.updated webhook:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
      break;

    case 'user.deleted':
      try {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('clerk_user_id', evt.data.id);

        if (error) {
          console.error('Error deleting user from Supabase:', error);
          return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
        }

        console.log('User deleted successfully:', evt.data.id);
      } catch (error) {
        console.error('Error handling user.deleted webhook:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
      break;

    default:
      console.log('Unhandled webhook event type:', evt.type);
  }

  return NextResponse.json({ message: 'Webhook processed successfully' });
}