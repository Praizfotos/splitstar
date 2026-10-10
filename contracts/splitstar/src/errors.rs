// ============================================================================
// errors.rs — Typed error codes for SplitStar
// ============================================================================

use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    // Init
    AlreadyInitialized = 1,

    // Pool creation
    InvalidGoal = 10,
    NameTooLong = 11,
    InvalidMaxMembers = 12,

    // Pool not found / wrong state
    PoolNotFound = 20,
    PoolNotOpen = 21,
    PoolNotLocked = 22,
    PoolCancelled = 23,
    PoolAlreadySettled = 24,
    PoolNotOwner = 25,

    // Membership
    AlreadyMember = 30,
    NotAMember = 31,
    PoolFull = 32,

    // Deposits
    InvalidAmount = 40,
    GoalAlreadyMet = 41,

    // Expenses
    ExpenseNotFound = 50,
    ExpenseAlreadyApproved = 51,
    InsufficientFunds = 52,
    DescriptionTooLong = 53,
    TooManyExpenses = 54,
}
