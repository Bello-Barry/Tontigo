-- AI Chat History Tables
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'Nouvelle conversation',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own conversations"
ON public.ai_conversations
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage messages in their conversations"
ON public.ai_messages
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.ai_conversations
        WHERE id = ai_messages.conversation_id
        AND user_id = auth.uid()
    )
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);

-- RLS for Group Messages Deletion
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- If policies don't exist, create them. Assuming standard read/write policies exist or are handled elsewhere.
-- We specifically add deletion policy for own messages.
CREATE POLICY "Users can delete their own group messages"
ON public.group_messages
FOR DELETE
USING (auth.uid() = user_id);
