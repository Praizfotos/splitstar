// ============================================================================
// tests/test_pools.rs — Core pool lifecycle tests
// ============================================================================

#![cfg(test)]

use soroban_sdk::{bytes, testutils::Address as _, token::StellarAssetClient, Address, Env};
use splitstar_contract::{PoolStatus, SplitStarContract, SplitStarContractClient};

// ── Test harness ──────────────────────────────────────────────────────────────

struct TestCtx {
    env: Env,
    client: SplitStarContractClient<'static>,
    token_id: Address,
    alice: Address, // group organiser
    bob: Address,
    carol: Address,
    dave: Address,
}

impl TestCtx {
    fn new() -> Self {
        let env = Env::default();
        env.mock_all_auths();

        let id = env.register(SplitStarContract, ());
        let client: SplitStarContractClient<'static> =
            unsafe { std::mem::transmute(SplitStarContractClient::new(&env, &id)) };

        let token_admin = Address::generate(&env);
        let token_id = env
            .register_stellar_asset_contract_v2(token_admin.clone())
            .address();
        let sac = StellarAssetClient::new(&env, &token_id);

        let alice = Address::generate(&env);
        let bob = Address::generate(&env);
        let carol = Address::generate(&env);
        let dave = Address::generate(&env);

        // Fund everyone with 10,000 USDC
        for addr in [&alice, &bob, &carol, &dave] {
            sac.mint(addr, &10_000_i128);
        }

        client.initialize();

        TestCtx {
            env,
            client,
            token_id,
            alice,
            bob,
            carol,
            dave,
        }
    }

    fn name(&self) -> soroban_sdk::Bytes {
        bytes!(&self.env, 0x547269705f546f6b796f) // "TripTokyo"
    }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[test]
fn test_create_pool_basic() {
    let t = TestCtx::new();
    let id = t
        .client
        .create_pool(&t.alice, &t.token_id, &t.name(), &1_000_i128, &0u32);
    assert_eq!(id, 0);

    let pool = t.client.get_pool(&id);
    assert_eq!(pool.status, PoolStatus::Open);
    assert_eq!(pool.goal, 1_000);
    assert_eq!(pool.members.len(), 1); // alice auto-joined
    assert_eq!(pool.total_deposited, 0);
}

#[test]
fn test_join_and_deposit() {
    let t = TestCtx::new();
    let id = t
        .client
        .create_pool(&t.alice, &t.token_id, &t.name(), &500_i128, &0u32);

    t.client.join_pool(&id, &t.bob);
    t.client.join_pool(&id, &t.carol);

    t.client.deposit(&id, &t.alice, &200_i128);
    t.client.deposit(&id, &t.bob, &150_i128);
    t.client.deposit(&id, &t.carol, &150_i128);

    let pool = t.client.get_pool(&id);
    assert_eq!(pool.total_deposited, 500);
    // Goal reached → auto-locked
    assert_eq!(pool.status, PoolStatus::Locked);
}

#[test]
fn test_goal_auto_locks_pool() {
    let t = TestCtx::new();
    let id = t
        .client
        .create_pool(&t.alice, &t.token_id, &t.name(), &300_i128, &0u32);

    t.client.join_pool(&id, &t.bob);

    // Under goal — still open
    t.client.deposit(&id, &t.alice, &100_i128);
    assert_eq!(t.client.get_pool(&id).status, PoolStatus::Open);

    // This deposit meets the goal
    t.client.deposit(&id, &t.bob, &200_i128);
    assert_eq!(t.client.get_pool(&id).status, PoolStatus::Locked);
}

#[test]
fn test_goal_progress_pct() {
    let t = TestCtx::new();
    let id = t
        .client
        .create_pool(&t.alice, &t.token_id, &t.name(), &200_i128, &0u32);

    t.client.deposit(&id, &t.alice, &50_i128);
    assert_eq!(t.client.goal_progress_pct(&id), 25);

    t.client.deposit(&id, &t.alice, &100_i128);
    assert_eq!(t.client.goal_progress_pct(&id), 75);
}

#[test]
fn test_cannot_join_twice() {
    let t = TestCtx::new();
    let id = t
        .client
        .create_pool(&t.alice, &t.token_id, &t.name(), &0_i128, &0u32);
    t.client.join_pool(&id, &t.bob);
    assert!(t.client.try_join_pool(&id, &t.bob).is_err());
}

#[test]
fn test_cannot_deposit_if_not_member() {
    let t = TestCtx::new();
    let id = t
        .client
        .create_pool(&t.alice, &t.token_id, &t.name(), &0_i128, &0u32);
    // Dave never joined
    assert!(t.client.try_deposit(&id, &t.dave, &100_i128).is_err());
}

#[test]
fn test_pool_full_rejects_new_member() {
    let t = TestCtx::new();
    // max_members = 2
    let id = t
        .client
        .create_pool(&t.alice, &t.token_id, &t.name(), &0_i128, &2u32);
    t.client.join_pool(&id, &t.bob);
    // Pool has alice (owner) + bob = 2; should be full
    assert!(t.client.try_join_pool(&id, &t.carol).is_err());
}

#[test]
fn test_member_balance_view() {
    let t = TestCtx::new();
    let id = t
        .client
        .create_pool(&t.alice, &t.token_id, &t.name(), &0_i128, &0u32);
    t.client.join_pool(&id, &t.bob);
    t.client.deposit(&id, &t.alice, &300_i128);
    t.client.deposit(&id, &t.bob, &200_i128);

    assert_eq!(t.client.member_balance(&id, &t.alice), 300);
    assert_eq!(t.client.member_balance(&id, &t.bob), 200);
}

#[test]
fn test_available_balance() {
    let t = TestCtx::new();
    let desc = bytes!(&t.env, 0x486f74656c); // "Hotel"
    let id = t
        .client
        .create_pool(&t.alice, &t.token_id, &t.name(), &0_i128, &0u32);
    t.client.join_pool(&id, &t.bob);
    t.client.deposit(&id, &t.alice, &500_i128);
    t.client.deposit(&id, &t.bob, &500_i128);

    // Submit and approve a 300 expense
    let merchant = Address::generate(&t.env);
    let eidx = t
        .client
        .submit_expense(&id, &t.alice, &merchant, &300_i128, &desc);
    t.client.approve_expense(&id, &eidx);

    assert_eq!(t.client.available_balance(&id), 700);
}

#[test]
fn test_next_pool_id_increments() {
    let t = TestCtx::new();
    assert_eq!(t.client.next_pool_id(), 0);
    t.client
        .create_pool(&t.alice, &t.token_id, &t.name(), &0_i128, &0u32);
    assert_eq!(t.client.next_pool_id(), 1);
    t.client
        .create_pool(&t.bob, &t.token_id, &t.name(), &0_i128, &0u32);
    assert_eq!(t.client.next_pool_id(), 2);
}
