<template>
  <v-dialog class="border-light-blue" v-model="isOpen" max-width="600">
    <v-card class="border-light-blue">
      <v-card-title>New Message</v-card-title>

      <v-form @submit.prevent="handleSubmit">
        <v-card-text class="pt-4">
          <!-- user search-->
          <v-autocomplete
            v-model="selectedUserId"
            v-model:search="searchText"
            :items="userOptions"
            :loading="isSearching"
            item-title="fullName"
            item-value="id"
            label="Search recipient (first, last)"
            hint="Start typing a name and select from the list"
            persistent-hint
            clearable
            hide-details="auto"
          />

          <!-- message body -->
          <v-textarea
            v-model="messageBody"
            label="Message"
            auto-grow
            rows="3"
            class="mt-4"
            hide-details="auto"
            required
          />
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="close" :disabled="isSubmitting">
            Cancel
          </v-btn>
          <v-btn
            type="submit"
            color="primary"
            :loading="isSubmitting"
            :disabled="!canSubmit"
          >
            Send
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useAuth } from "../composables/useAuth.js";

const API_BASE = "http://localhost:3000/api";
const { accessToken } = useAuth();

//Dialog State
const isOpen = ref(false);
const isSubmitting = ref(false);

//Form State
const selectedUserId = ref(null);
const messageBody = ref("");

//User Search State
const searchText = ref("");
const userOptions = ref([]);
const isSearching = ref(false);

let searchTimeout = null;
let lastController = null;

const canSubmit = computed(
  () => !!selectedUserId.value && messageBody.value.trim().length > 0
);

function open() {
  isOpen.value = true;
  userOptions.value = [];
}

function close() {
  isOpen.value = false;
  isSubmitting.value = false;
  // optional reset:
  searchText.value = "";
  selectedUserId.value = null;
  messageBody.value = "";
  userOptions.value = [];
}

//debounce user search
watch(searchText, (newVal) => {
  if (searchTimeout) clearTimeout(searchTimeout);

  if (!newVal || newVal.trim().length < 1) {
    userOptions.value = [];
    return;
  }

  searchTimeout = setTimeout(() => {
    fetchUsers(newVal.trim());
  }, 300);
});

async function fetchUsers(query) {
  try {
    isSearching.value = true;

    if (lastController) lastController.abort();
    lastController = new AbortController();

    const res = await fetch(
      `${API_BASE}/user/search?q=${encodeURIComponent(query)}`,
      {
        method: "GET",
        headers: accessToken.value
          ? { Authorization: `Bearer ${accessToken.value}` }
          : {},
        credentials: "include",
        signal: lastController.signal,
      }
    );

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Failed to search users");
    userOptions.value = data.users;
  } catch (error) {
    if (error.name === "AbortError") return;
    console.error("Error searching users:", error);
  } finally {
    isSearching.value = false;
  }
}

async function handleSubmit() {
  if (!canSubmit.value) return;

  try {
    isSubmitting.value = true;

    const res = await fetch(`${API_BASE}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken.value
          ? { Authorization: `Bearer ${accessToken.value}` }
          : {}),
      },
      credentials: "include",
      body: JSON.stringify({
        recipientId: selectedUserId.value,
        body: messageBody.value.trim(),
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to send message");

    console.log("Message sent!", data);
    close();
  } catch (error) {
    console.error("Error sending message:", error);
  } finally {
    isSubmitting.value = false;
  }
}

defineExpose({ open, close });
</script>

<style>
@import "./DialogUtils.css";
</style>