import dns from 'dns';
import { promisify } from 'util';

const lookup = promisify(dns.lookup);

async function test() {
  console.log('Testing DNS resolution for db.bzxohkrxcwodllketcpz.supabase.co...');

  try {
    // Try IPv4
    const v4 = await lookup('db.bzxohkrxcwodllketcpz.supabase.co', { family: 4 });
    console.log('IPv4 result:', v4);
  } catch (e) {
    console.log('IPv4 lookup error:', e.message);
  }

  try {
    // Try IPv6
    const v6 = await lookup('db.bzxohkrxcwodllketcpz.supabase.co', { family: 6 });
    console.log('IPv6 result:', v6);
  } catch (e) {
    console.log('IPv6 lookup error:', e.message);
  }

  try {
    // Default (both)
    const any = await lookup('db.bzxohkrxcwodllketcpz.supabase.co');
    console.log('Default lookup:', any);
  } catch (e) {
    console.log('Default lookup error:', e.message);
  }
}

test();
