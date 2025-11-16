#!/usr/bin/env ts-node

/**
 * Quick script to find a recent pump.fun token with active bonding curve
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { BorshAccountsCoder, Idl } from '@coral-xyz/anchor';
import PUMP_BONDING_CURVE_IDL from './src/services/pump-bonding-curve-idl.json';

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const PUMP_PROGRAM_ID = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';
const GRADUATION_THRESHOLD_SOL = 85;
const LAMPORTS_PER_SOL = 1_000_000_000;

async function findRecentToken(): Promise<string | null> {
  console.log('🔍 Searching for recent pump.fun tokens with active bonding curves...\n');

  const connection = new Connection(RPC_URL, 'confirmed');
  const accountsCoder = new BorshAccountsCoder(PUMP_BONDING_CURVE_IDL as Idl);

  try {
    // Get recent signatures from pump.fun program
    console.log('📡 Fetching recent transactions...');
    const signatures = await connection.getSignaturesForAddress(
      new PublicKey(PUMP_PROGRAM_ID),
      { limit: 100 }
    );

    console.log(`   Found ${signatures.length} recent transactions\n`);

    const checkedMints = new Set<string>();

    for (const sig of signatures) {
      try {
        // Get parsed transaction
        const tx = await connection.getParsedTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0
        });

        if (!tx || !tx.meta) continue;

        // Look for token mints in post token balances
        const postBalances = tx.meta.postTokenBalances || [];

        for (const balance of postBalances) {
          const mint = balance.mint;

          if (checkedMints.has(mint)) continue;
          checkedMints.add(mint);

          // Try to get bonding curve for this mint
          const mintPubkey = new PublicKey(mint);
          const [bondingCurvePDA] = PublicKey.findProgramAddressSync(
            [Buffer.from('bonding-curve'), mintPubkey.toBuffer()],
            new PublicKey(PUMP_PROGRAM_ID)
          );

          const accountInfo = await connection.getAccountInfo(bondingCurvePDA);

          if (!accountInfo) continue; // No bonding curve

          // Try to decode
          try {
            const structData = accountInfo.data.slice(8);
            const rawData = accountsCoder.decode('BondingCurve', structData);

            if (!rawData) continue;

            const realSolReserves = BigInt(rawData.realSolReserves.toString());
            const solRaised = Number(realSolReserves) / LAMPORTS_PER_SOL;
            const progress = Math.min(100, (solRaised / GRADUATION_THRESHOLD_SOL) * 100);
            const complete = rawData.complete || false;

            // Only show active tokens (not graduated)
            if (!complete && progress < 100) {
              console.log('✅ FOUND ACTIVE TOKEN!');
              console.log(`   Mint: ${mint}`);
              console.log(`   Progress: ${progress.toFixed(2)}%`);
              console.log(`   SOL Raised: ${solRaised.toFixed(4)} SOL`);
              console.log(`   SOL Remaining: ${(GRADUATION_THRESHOLD_SOL - solRaised).toFixed(4)} SOL`);

              let category = 'unknown';
              if (progress >= 70) category = 'final-stretch';
              else if (progress > 0) category = 'new';

              console.log(`   Category: ${category}`);
              console.log('\n✅ Use this token address for testing!\n');

              return mint;
            }
          } catch (error) {
            // Couldn't decode - likely graduated or wrong format
            continue;
          }
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 50));

      } catch (error) {
        // Skip errors, continue searching
        continue;
      }
    }

    console.log('\n⚠️  No active bonding curve tokens found in recent transactions');
    console.log('This could mean:');
    console.log('• All recent tokens have graduated very quickly');
    console.log('• Need to check more transactions');
    console.log('• Try visiting pump.fun directly to find a newly created token');

    return null;

  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
}

findRecentToken().catch(console.error);
