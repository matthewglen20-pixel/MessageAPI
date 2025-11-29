<template>
  <DialogTwo ref="profileRef" />
  <div class="pa-2 text-center">
    <v-dialog v-model="dialog" max-width="600">
      <v-card class="border-light-blue" prepend-icon="mdi-account" title="Login to Profile">
        <v-card-text>
          <v-row dense class="mt-2">
            <v-col cols="6">
              <v-text-field label="First name" v-model="firstName" required />
            </v-col>

            <v-col cols="6">
              <v-text-field label="Email" v-model="email" required />
            </v-col>

            <v-col cols="6">
              <v-text-field
                v-model="password"
                label="Password"
                required
                :type="showPassword ? 'text' : 'password'"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword"
              ></v-text-field>
            </v-col>

            <v-col cols="6">
              <v-text-field
                v-model="confirmPassword"
                label="Confirm Password"
                :error-messages="passwordConfirmError"
                required
                :type="showPassword ? 'text' : 'password'"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword"
              />
            </v-col>
          </v-row>
          <div class="mt-2">
            <small class="text-caption text-medium-emphasis">
              {{ dialogMsg }}
            </small>
            <div v-if="loginError" class="text-red text-caption mt-1">
              ❌ {{ loginError }}
            </div>
            <div v-if="loginSuccess" class="text-green text-caption mt-1">
              ✅ {{ loginSuccess }}
            </div>
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions class="d-flex justify-space-between">
          <v-btn
            class=""
            text="close"
            color="black"
            variant="tonal"
            @click="dialog = false"
          />

          <v-btn
            class=""
            color="primary"
            text="Create Account"
            variant="tonal"
            @click="openSignup()"
          />

          <v-btn
            class=""
            color="primary"
            text="Login"
            variant="tonal"
            :loading="loading"
            :disabled="loading || !email.trim() || !password.trim()"
            @click="handleLogin"
          />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref } from "vue";
import DialogTwo from "./DialogTwo.vue";
import { useAuth } from "../composables/useAuth.js";
const dialogMsg = ref("");

const profileRef = ref(null);
const dialog = ref(false);

const passwordConfirmError = ref("");
const showPassword = ref(false);
const firstName = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");

const loginError = ref("");
const loginSuccess = ref("");
const loading = ref(false);

const { setSession, clearSession, fetchCurrentUser } = useAuth();

function resetForm() {
  firstName.value = "";
  email.value = "";
  password.value = "";
  confirmPassword.value = "";
  showPassword.value = false;

  dialogMsg.value = "";
  loginError.value = "";
  loginSuccess.value = "";
  passwordConfirmError.value = "";
}

function open() {
  dialog.value = true;
  resetForm();
}

function close() {
  dialog.value = false;
  resetForm();
}

function openSignup() {
  profileRef.value?.open();
  close();
  console.log("Create Account clicked");
}

async function handleLogin() {
  loginError.value = "";
  loginSuccess.value = "";
  loading.value = true;

  try {
    if (confirmPassword.value && password.value !== confirmPassword.value) {
      passwordConfirmError.value = "Passwords do not match";
      throw new Error("Passwords do not match");
    }

    const res = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email: email.value,
        password: password.value,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Login failed");
    }

    if (data.accessToken) {
      setSession(data.accessToken);
    }
    if (fetchCurrentUser) {
      await fetchCurrentUser();
    }

    dialogMsg.value = "Logged In!🎉";
    loginSuccess.value = "Logged in successfully!";
    console.log("Logged in user:", data.user);

    setTimeout(() => {
      close();
    }, 2000);
  } catch (err) {
    loginError.value = err.message;
  } finally {
    loading.value = false;
  }
}

// allows parent components (like Wireframe.vue) to call open() / close()
defineExpose({
  open,
  close,
  clearSession,
});
</script>

<style>
@import "./DialogUtils.css";
</style>