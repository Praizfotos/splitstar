// ============================================================================
// tests/test_expenses.rs — Expense submission, approval, and settlement tests
// ============================================================================

#![cfg(test)]

use soroban_sdk::{bytes, testutils::Address as _, token::StellarAssetClient, Address, Env};
use splitstar_contract::{PoolStatus, SplitStarContract, SplitStarContractClient};

struct Ctx {
    env: Env,
    client: SplitStarContractClient<'static>,
    token_id: Address,
    alice: Address,
    bob: Address,
}

impl Ctx {
    fn setup() -> (Self, u64) {
        let env = Env::default();
        env.mock_all_auths();

        let cid = env.register(SplitStarContract, ());
        let client: SplitStarContractClient<'static> =
            unsafe { std::mem::transmute(SplitStarContractClient::new(&env, &cid)) };

        let token_admin = Address::generate(&env);
        let token_id = env
            .register_stellar_asset_contract_v2(token_admin.clone())
            .address();
        let sac = StellarAssetClient::new(&env, &token_id);

        let alice = Address::generate(&env);
        let bob = Address::generate(&env);
        let carol = Address::generate(&env);

        for a in [&alice, &bob, &carol] {
            sac.mint(a, &10_000_i128);
        }
        client.initialize();

        let name = bytes!(&env, 0x476f6f6757656b656e64); // "GooWeekend"
        let pid = client.create_pool(&alice, &token_id, &name, &0_i128, &0u32);
        client.join_pool(&pid, &bob);
        client.join_pool(&pid, &carol);

        client.deposit(&pid, &alice, &1_000_i128);
        client.deposit(&pid, &bob, &1_000_i128);
        client.deposit(&pid, &carol, &1_000_i128);

        let ctx = Ctx {
            env,
            client,
            token_id,
            alice,
            bob,
        };
        (ctx, pid)
    }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[test]
fn test_submit_and_approve_expense() {
    let (t, pid) = Ctx::setup();
    let hotel = Address::generate(&t.env);
    let desc = bytes!(&t.env, 0x486f74656c); // "Hotel"

    let eidx = t
        .client
        .submit_expense(&pid, &t.alice, &hotel, &600_i128, &desc);
    assert_eq!(eidx, 0);

    t.client.approve_expense(&pid, &eidx);

    let hotel_bal = soroban_sdk::token::Client::new(&t.env, &t.token_id).balance(&hotel);
    assert_eq!(hotel_bal, 600);

    assert_eq!(t.client.available_balance(&pid), 2_400);
}

#[test]
fn test_multiple_expenses_sequential() {
    let (t, pid) = Ctx::setup();
    let restaurant = Address::generate(&t.env);
    let taxi = Address::generate(&t.env);
    let d1 = bytes!(&t.env, 0x44696e6e6572); // "Dinner"
    let d2 = bytes!(&t.env, 0x54617869); // "Taxi"

    let e1 = t
        .client
        .submit_expense(&pid, &t.alice, &restaurant, &300_i128, &d1);
    let e2 = t.client.submit_expense(&pid, &t.bob, &taxi, &150_i128, &d2);

    t.client.approve_expense(&pid, &e1);
    t.client.approve_expense(&pid, &e2);

    let token = soroban_sdk::token::Client::new(&t.env, &t.token_id);
    assert_eq!(token.balance(&restaurant), 300);
    assert_eq!(token.balance(&taxi), 150);
    assert_eq!(t.client.available_balance(&pid), 2_550);
}

#[test]
fn test_cannot_approve_twice() {
    let (t, pid) = Ctx::setup();
    let merchant = Address::generate(&t.env);
    let desc = bytes!(&t.env, 0x5465737420); // "Test "
    let eidx = t
        .client
        .submit_expense(&pid, &t.alice, &merchant, &100_i128, &desc);
    t.client.approve_expense(&pid, &eidx);
    assert!(t.client.try_approve_expense(&pid, &eidx).is_err());
}

#[test]
fn test_expense_exceeds_balance_rejected() {
    let (t, pid) = Ctx::setup();
    let merchant = Address::generate(&t.env);
    let desc = bytes!(&t.env, 0x546f6f4269673f); // "TooBig?"
                                                 // Total in pool = 3000; try to spend 5000
    let eidx = t
        .client
        .submit_expense(&pid, &t.alice, &merchant, &5_000_i128, &desc);
    assert!(t.client.try_approve_expense(&pid, &eidx).is_err());
}

#[test]
fn test_settle_pro_rata_refund() {
    let (t, pid) = Ctx::setup();
    // Approve 1500 in expenses, 1500 remains
    let merchant = Address::generate(&t.env);
    let desc = bytes!(&t.env, 0x486f74656c); // "Hotel"
    let eidx = t
        .client
        .submit_expense(&pid, &t.alice, &merchant, &1_500_i128, &desc);
    t.client.approve_expense(&pid, &eidx);

    let alice_before = soroban_sdk::token::Client::new(&t.env, &t.token_id).balance(&t.alice);
    let bob_before = soroban_sdk::token::Client::new(&t.env, &t.token_id).balance(&t.bob);

    t.client.settle_pool(&pid);

    let token = soroban_sdk::token::Client::new(&t.env, &t.token_id);
    // Each deposited 1000 of 3000 total = 33.33%, rounded down
    // Remaining 1500 × (1000/3000) = 500 each
    assert_eq!(token.balance(&t.alice) - alice_before, 500);
    assert_eq!(token.balance(&t.bob) - bob_before, 500);

    let pool = t.client.get_pool(&pid);
    assert_eq!(pool.status, PoolStatus::Settled);
}

#[test]
fn test_cancel_full_refund() {
    let (t, pid) = Ctx::setup();
    let alice_before = soroban_sdk::token::Client::new(&t.env, &t.token_id).balance(&t.alice);
    let bob_before = soroban_sdk::token::Client::new(&t.env, &t.token_id).balance(&t.bob);

    t.client.cancel_pool(&pid);

    let token = soroban_sdk::token::Client::new(&t.env, &t.token_id);
    // Full refunds — no expenses were approved
    assert_eq!(token.balance(&t.alice) - alice_before, 1_000);
    assert_eq!(token.balance(&t.bob) - bob_before, 1_000);

    assert_eq!(t.client.get_pool(&pid).status, PoolStatus::Cancelled);
}

#[test]
fn test_cannot_cancel_after_expense_approved() {
    let (t, pid) = Ctx::setup();
    let merchant = Address::generate(&t.env);
    let desc = bytes!(&t.env, 0x486f74656c);
    let eidx = t
        .client
        .submit_expense(&pid, &t.alice, &merchant, &100_i128, &desc);
    t.client.approve_expense(&pid, &eidx);
    // total_spent > 0 → cancel not allowed
    assert!(t.client.try_cancel_pool(&pid).is_err());
}

#[test]
fn test_nonmember_cannot_submit_expense() {
    let (t, pid) = Ctx::setup();
    let outsider = Address::generate(&t.env);
    let merchant = Address::generate(&t.env);
    let desc = bytes!(&t.env, 0x486f74656c);
    assert!(t
        .client
        .try_submit_expense(&pid, &outsider, &merchant, &100_i128, &desc)
        .is_err());
}

#[test]
fn test_zero_deposit_settle_does_not_crash() {
    let (t, pid) = Ctx::setup();
    // Don't deposit, just settle — 0 refunds
    let name2 = bytes!(&t.env, 0x456d707479); // "Empty"
    let pid2 = t
        .client
        .create_pool(&t.alice, &t.token_id, &name2, &0_i128, &0u32);
    t.client.settle_pool(&pid2);
    assert_eq!(t.client.get_pool(&pid2).status, PoolStatus::Settled);
    let _ = pid; // silence unused warning
}
