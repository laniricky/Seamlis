-- Membership tiers defined by a creator for their channel
CREATE TABLE memberships (
    id UUID PRIMARY KEY,
    channel_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_cents INT NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    perks TEXT, -- JSON array of perk descriptions
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- A user's active subscription to a membership tier
CREATE TABLE user_memberships (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, membership_id)
);

-- Immutable financial ledger for all transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    payer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    payee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL, -- 'TIP', 'MEMBERSHIP'
    amount_cents INT NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'SUCCEEDED', 'FAILED'
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_payee ON transactions(payee_id);
CREATE INDEX idx_transactions_payer ON transactions(payer_id);
CREATE INDEX idx_memberships_channel ON memberships(channel_id);
