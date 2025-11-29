<template>
  <v-app  id="inspire">
    <!-- app bar -->
    <v-app-bar class="background-light-blue" :elevation="2">
      <template v-slot:prepend>
        <v-app-bar-nav-icon @click="toggleDrawer"></v-app-bar-nav-icon>
      </template>

      <v-app-bar-title class="d-flex">Message Hub</v-app-bar-title>
    </v-app-bar>

    <v-divider class="border-color-light-blue"/>
    <!-- left drawer -->
    <v-navigation-drawer class="light-blue" v-model="drawer">
      <v-sheet class="pa-6 background-light-blue" >
        <v-avatar class="mb-4" color="white" size="64">
          <v-icon v-if="currentUser">mdi-account-check</v-icon>
          <v-icon v-else>mdi-account-off</v-icon>
        </v-avatar>
        <div v-if="currentUser">
          {{ currentUser.email }}
        </div>
        <div v-else class="text-medium-emphasis">Not Signed In!</div>
      </v-sheet>

      <v-divider />

      <v-list>
        <v-list-item
          v-for="[icon, text] in navigationLinks"
          :key="icon"
          :prepend-icon="icon"
          :title="text"
          link
          @click="handleClick(text)"
        />
      </v-list>
    </v-navigation-drawer>

    <!-- middle -->
    <v-main>
      <v-container>
        <v-row>
          <!--New Message Card-->
          <v-col cols="12">
            <v-card class="mb-4 border-light-blue" @click="openNewMessageDialog" role="button">
              <v-list>
                <v-list-item>
                  <template #prepend>
                    <v-icon>mdi-email-plus</v-icon>
                  </template>
                  <v-list-item-title>New Message</v-list-item-title>
                  <v-list-item-subtitle
                    >Click to compose a new message</v-list-item-subtitle
                  >
                </v-list-item>
              </v-list>
            </v-card>
          </v-col>

          <!-- Message Threads -->
          <v-col cols="12" v-for="t in threads" :key="t.userId">
            <v-card class="mb-2" @click="openThread(t)" role="button">
              <v-list>
                <v-list-item>
                  <!-- avatar -->
                  <template #prepend>
                    <v-avatar color="grey-darken-1">
                      <v-icon>mdi-account</v-icon>
                    </v-avatar>
                  </template>
                  <!-- full name + 'new message'-->
                  <v-list-item-title>
                    {{ t.fullName }}
                  </v-list-item-title>
                  <v-list-item-subtitle
                    >New message • {{ t.lastBody }}
                  </v-list-item-subtitle>
                  <!-- time -->
                  <template #append>
                    <span class="text-caption">
                      {{ formatTime(t.lastMessageAt) }}
                    </span>
                  </template>
                </v-list-item>
              </v-list>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <!-- Dialog components -->
    <DialogOne ref="profileRef" />
    <DialogTwo ref="dialogTwoRef" />
    <AccountDialog ref="accountDialogRef" />
    <NewMessageDialog ref="newMessageDialogRef" @message-sent="fetchThreads" />
    <ConversationDialog
      ref="conversationRef"
      :thread="activeThread"
      @message-sent="fetchThreads"
    />
    <LoginRequiredDialog ref="loginRequiredRef" />
  </v-app>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue";
import DialogOne from "./DialogOne.vue";
import DialogTwo from "./DialogTwo.vue";
import NewMessageDialog from "./NewMessageDialog.vue";
import ConversationDialog from "./ConversationDialog.vue";
import LoginRequiredDialog from "./LoginRequiredDialog.vue";
import AccountDialog from "./accountDialog.vue";
import { useAuth } from "../composables/useAuth.js";

const API_BASE = "http://localhost:3000/api";

const drawer = ref(true);
const profileRef = ref(null);
const dialogTwoRef = ref(null);
const newMessageDialogRef = ref(null);
const conversationRef = ref(null);
const loginRequiredRef = ref(null);
const accountDialogRef = ref(null);

const threads = ref([]);
const activeThread = ref(null);

const { currentUser, fetchCurrentUser, accessToken } = useAuth();

const navigationLinks = computed(() => {
  const accountLink = currentUser.value
    ? ["mdi-account-circle", "Account"]
    : ["mdi-login", "Sign-In"];

  return [
    accountLink,
    ["mdi-inbox-arrow-down", "Inbox"],
    ["mdi-send", "Send"],
    ["mdi-delete", "Trash"],
  ];
});

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

//check if user is logged in on mount
onMounted(async () => {
  await fetchCurrentUser();
  await fetchThreads();
});

//fetch threads for user
async function fetchThreads() {
  if (!accessToken.value) {
    threads.value = [];
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/messages/threads`, {
      headers: {
        Authorization: `Bearer ${accessToken.value}`,
      },
      credentials: "include",
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch threads");

    const unique = new Map();

    for (const t of data.threads || []) {
      const userId = t.userId ?? t.user_id;
      const fullName = t.fullName ?? t.full_name;

      unique.set(userId, {
        ...t,
        userId,
        fullName,
      });
    }

    threads.value = [...unique.values()];
  } catch (err) {
    console.error(" Failed to fetch threads:", err);
  }
}

//watch for accessToken changes and refetch threads
watch(accessToken, () => {
  fetchThreads();
});

function openThread(thread) {
  activeThread.value = thread;
  conversationRef.value?.open();
}

//Side Nav click handler
function handleClick(text) {
  if (text === "Sign-In") {
    profileRef.value.open();
    return;
  } else if (text === "Send") {
    openNewMessageDialog();
    return;
  } else if (text === "Account") {
    accountDialogRef.value?.open();
    return;
  } else {
    console.log("Clicked:", text);
  }
}

function openNewMessageDialog() {
  if (!currentUser.value) {
    loginRequiredRef.value.open();
    return;
  }
  newMessageDialogRef.value?.open();
}

function toggleDrawer() {
  drawer.value = !drawer.value;
}
</script>

<style>
@import "./DialogUtils.css";
</style>

