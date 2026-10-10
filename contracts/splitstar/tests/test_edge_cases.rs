// ============================================================================
// tests/test_edge_cases.rs — Security and edge case tests
// ============================================================================

#![cfg(test)]

use soroban_sdk::{bytes, testutils::Address as _, token::StellarAssetClient, Address, Env};
use splitstar_contract::{SplitStarContract, SplitStarContractClient};

fn make_env() -> (
    Env,
    SplitStarContractClient<'static>,
    Address,
    Address,
    Address,
) {
    let env = Env::default();
    env.mock_all_auths();

    let id = env.register(SplitStarContract, ());
    let client: SplitStarContractClient<'static> =
        unsafe { std::mem::transmute(SplitStarContractClient::new(&env, &id)) };

    let token_admin = Address::generate(&env);
    let token_id = env
        .register_stellar_asset_contract_v2(token_admin.clone())
        .address();
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    StellarAssetClient::new(&env, &token_id).mint(&alice, &50_000_i128);
    StellarAssetClient::new(&env, &token_id).mint(&bob, &50_000_i128);
    client.initialize();

    (env, client, token_id, alice, bob)
}

#[test]
fn test_double_initialize_rejected() {
    let (_, client, _, _, _) = make_env();
    assert!(client.try_initialize().is_err());
}

#[test]
fn test_cannot_deposit_zero() {
    let (env, client, token_id, alice, bob) = make_env();
    let name = bytes!(&env, 0x54657374);
    let pid = client.create_pool(&alice, &token_id, &name, &0_i128, &0u32);
    client.join_pool(&pid, &bob);
    assert!(client.try_deposit(&pid, &alice, &0_i128).is_err());
    let _ = bob;
}

#[test]
fn test_cannot_deposit_negative() {
    let (env, client, token_id, alice, bob) = make_env();
    let name = bytes!(&env, 0x54657374);
    let pid = client.create_pool(&alice, &token_id, &name, &0_i128, &0u32);
    client.join_pool(&pid, &bob);
    assert!(client.try_deposit(&pid, &alice, &-100_i128).is_err());
    let _ = bob;
}

#[test]
fn test_get_nonexistent_pool_errors() {
    let (_, client, _, _, _) = make_env();
    assert!(client.try_get_pool(&9999u64).is_err());
}

#[test]
fn test_owner_cannot_redirect_expense_to_self() {
    // The owner approves, but payee is always the payee field — not the owner
    // This tests that the contract correctly pays the payee, not the caller
    let (env, client, token_id, alice, bob) = make_env();
    let name = bytes!(&env, 0x54657374);
    let pid = client.create_pool(&alice, &token_id, &name, &0_i128, &0u32);
    client.join_pool(&pid, &bob);
    client.deposit(&pid, &alice, &1_000_i128);
    client.deposit(&pid, &bob, &1_000_i128);

    let merchant = Address::generate(&env);
    let desc = bytes!(&env, 0x54657374);
    let eidx = client.submit_expense(&pid, &bob, &merchant, &500_i128, &desc);
    client.approve_expense(&pid, &eidx);

    let token = soroban_sdk::token::Client::new(&env, &token_id);
    // Merchant (payee) received 500
    assert_eq!(token.balance(&merchant), 500);
    // Alice (owner) did NOT receive anything from this approval
    assert_eq!(token.balance(&alice), 49_000); // started 50k, deposited 1k
}

#[test]
fn test_settle_after_settle_rejected() {
    let (env, client, token_id, alice, _bob) = make_env();
    let name = bytes!(&env, 0x54657374);
    let pid = client.create_pool(&alice, &token_id, &name, &0_i128, &0u32);
    client.settle_pool(&pid);
    assert!(client.try_settle_pool(&pid).is_err());
}

#[test]
fn test_cancel_after_cancel_rejected() {
    let (env, client, token_id, alice, _bob) = make_env();
    let name = bytes!(&env, 0x54657374);
    let pid = client.create_pool(&alice, &token_id, &name, &0_i128, &0u32);
    client.cancel_pool(&pid);
    assert!(client.try_cancel_pool(&pid).is_err());
}

#[test]
fn test_deposit_after_cancel_rejected() {
    let (env, client, token_id, alice, bob) = make_env();
    let name = bytes!(&env, 0x54657374);
    let pid = client.create_pool(&alice, &token_id, &name, &0_i128, &0u32);
    client.join_pool(&pid, &bob);
    client.cancel_pool(&pid);
    assert!(client.try_deposit(&pid, &alice, &100_i128).is_err());
}

#[test]
fn test_lock_pool_manually() {
    let (env, client, token_id, alice, bob) = make_env();
    let name = bytes!(&env, 0x54657374);
    // No goal — owner locks manually
    let pid = client.create_pool(&alice, &token_id, &name, &0_i128, &0u32);
    client.join_pool(&pid, &bob);
    client.deposit(&pid, &alice, &500_i128);

    client.lock_pool(&pid);

    // Now cannot deposit
    assert!(client.try_deposit(&pid, &bob, &100_i128).is_err());
}

#[test]
fn test_no_goal_pool_goal_progress_is_zero() {
    let (env, client, token_id, alice, _bob) = make_env();
    let name = bytes!(&env, 0x54657374);
    let pid = client.create_pool(&alice, &token_id, &name, &0_i128, &0u32);
    client.deposit(&pid, &alice, &500_i128);
    assert_eq!(client.goal_progress_pct(&pid), 0);
}
