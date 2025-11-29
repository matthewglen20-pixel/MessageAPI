<template>
  <v-dialog v-model="isOpen" max-width="700">
    <v-card class="pa-0">
      <!-- HEADER -->
      <v-card-title class="d-flex align-center">
        <v-avatar class="mr-3" color="grey-darken-1">
          <v-icon>mdi-account</v-icon>
        </v-avatar>
        <div>
          <div class="font-weight-medium">{{ thread?.fullName }}</div>
          <div class="text-caption text-medium-emphasis">
            {{ thread?.email }}
          </div>
        </div>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="close" />
      </v-card-title>

      <v-divider />

      <!-- CHAT AREA (bottom-anchored like iPhone) -->
      <v-card-text class="chat-area" ref="chatAreaRef">
        <div v-for="m in messages" :key="m.id" class="mb-2">
          <!-- RIGHT bubble (me) -->
          <div v-if="m.sender_id === meId" class="bubble-row right">
            <div class="bubble me">
              {{ m.body }}
              <div class="time">{{ formatTime(m.created_at) }}</div>
            </div>
          </div>

          <!-- LEFT bubble (them) -->
          <div v-else class="bubble-row left">
            <div class="bubble them">
              {{ m.body }}
              <div class="time">{{ formatTime(m.created_at) }}</div>
            </div>
          </div>
        </div>
      </v-card-text>

      <v-divider />

      <!-- INPUT BAR -->
      <v-card-actions class="pa-3">
        <v-text-field
          v-model="draft"
          placeholder="iMessage..."
          hide-details
          density="comfortable"
          class="flex-grow-1"
          @keyup.enter="send"
        />
        <v-btn
          color="primary"
          :loading="sending"
          :disabled="!draft.trim()"
          @click="send"
        >
          Send
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, nextTick } from "vue";
import { useAuth } from "../composables/useAuth.js";

const props = defineProps({
  thread: Object,
});

const emit = defineEmits(["message-sent"]);

const API_BASE = "http://localhost:3000/api";
const { accessToken } = useAuth();

const isOpen = ref(false);
const messages = ref([]);
const draft = ref("");
const sending = ref(false);
const chatAreaRef = ref(null);

const meId = ref(null);

//open/close dialog
function open() {
  isOpen.value = true;
  loadConversation();
}

function close() {
  isOpen.value = false;
  draft.value = "";
}

//watch for thread changes
watch(
  () => props.thread,
  () => {
    if (isOpen.value) loadConversation();
  }
);

//load conversation messages
async function loadConversation() {
  if (!props.thread?.userId) return;

  try {
    if (accessToken.value) {
      try {
        const payload = JSON.parse(atob(accessToken.value.split(".")[1]));
        meId.value = payload.sub;
      } catch (err) {
        meId.value = null;
        console.error("Failed to parse access token:", err);
      }
    }
    const res = await fetch(
      `${API_BASE}/messages/with/${props.thread.userId}`,
      {
        headers: accessToken.value
          ? { Authorization: `Bearer ${accessToken.value}` }
          : {},
        credentials: "include",
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load conversation");

    messages.value = data.messages || [];
    await nextTick();
    scrollToBottom();
  } catch (err) {
    console.log("Failed to load conversation:", err);
  }
}

//send message
async function send() {
  if (!draft.value.trim()) return;

  try {
    sending.value = true;
    const res = await fetch(`${API_BASE}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken.value}`,
      },
      credentials: "include",
      body: JSON.stringify({
        recipientId: props.thread.userId,
        body: draft.value.trim(),
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to send message");

    draft.value = "";

    //reload conversation
    await loadConversation();
    emit("message-sent");
  } catch (err) {
    console.error("Failed to send message:", err);
  } finally {
    sending.value = false;
  }
}

function scrollToBottom() {
  const el = chatAreaRef.value;
  if (!el) return;
  el.scrollTop = el.scrollHeight;
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

defineExpose({
  open,
  close,
});
</script>

<style scoped>
.chat-area {
  height: 420px;
  overflow-y: auto;
  background: #f7f7f7;
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.bubble-row {
  display: flex;
}

.bubble-row.right {
  justify-content: flex-end;
}

.bubble-row.left {
  justify-content: flex-start;
}

.bubble {
  max-width: 70%;
  padding: 10px 12px;
  border-radius: 16px;
  font-size: 15px;
  line-height: 1.3;
  position: relative;
}

.bubble.me {
  background: #1976d2;
  color: white;
  border-bottom-right-radius: 4px;
}

.bubble.them {
  background: white;
  color: #111;
  border-bottom-left-radius: 4px;
}

.time {
  font-size: 10px;
  opacity: 0.7;
  margin-top: 4px;
  text-align: right;
}
</style>
