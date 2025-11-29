<template>
  <div @click="close()" class="pa-4 text-center">
    <v-dialog class="border-light-blue" v-model="dialog2" max-width="600">
      <v-card
        class="border-light-blue"
        prepend-icon="mdi-account"
        title="User Profile"
      >
        <v-card-text>
          <v-row dense>
            <v-col cols="12" md="4" sm="6">
              <v-text-field
                v-model="firstName"
                label="First name"
                required
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="4" sm="6">
              <v-text-field
                v-model="lastName"
                label="Last name"
                required
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="4" sm="6">
              <v-text-field
                v-model="email"
                label="Email"
                type="Email"
                required
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="4" sm="6">
              <v-text-field
                v-model="password"
                label="Password"
                required
                :type="showPassword ? 'text' : 'password'"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="4" sm="6">
              <v-text-field
                v-model="confirmPassword"
                label="Confirm Password"
                :error-messages="passwordConfirmError"
                required
                :type="showPassword ? 'text' : 'password'"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword = !showPassword"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="4" sm="6">
              <v-text-field
                v-model="confirmEmail"
                label="Confirm email"
                type="email"
                :error-messages="emailConfirmError"
                required
              ></v-text-field>
            </v-col>
          </v-row>

          <!--  Global success or error messages -->
          <div class="mt-4">
            <p v-if="submitSuccess" class="text-green">✔ {{ submitSuccess }}</p>
            <p v-if="submitError" class="text-red">❌ {{ submitError }}</p>
          </div>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="d-flex justify-space-between">
          <v-btn
            color="red"
            text="Close"
            variant="plain"
            @click="close"
            :disabled="loading"
          ></v-btn>

          <v-btn
            color="primary"
            text="Save"
            variant="tonal"
            :loading="loading"
            :disabled="loading"
            @click="handleSave"
          ></v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script setup>
import { ref } from "vue";
import { useAuth } from "../composables/useAuth.js";

const dialog2 = ref(false);

/* sign-in field */
const firstName = ref("");
const lastName = ref("");
const email = ref("");
const confirmEmail = ref("");
const password = ref("");
const confirmPassword = ref("");
const showPassword = ref(false);

/* Validation errors */
const emailConfirmError = ref("");
const passwordConfirmError = ref("");

/* Submission feedback */
const submitSuccess = ref("");
const submitError = ref("");
const loading = ref(false);

const { setSession, clearSession, fetchCurrentUser } = useAuth();

/* Open & close logic */
function open() {
  dialog2.value = true;
  console.log("Dialog Two opened");
}

function close() {
  firstName.value = "";
  lastName.value = "";
  email.value = "";
  confirmEmail.value = "";
  password.value = "";
  confirmPassword.value = "";

  dialog2.value = false;
}

/* Save function */

async function handleSave() {
  emailConfirmError.value = "";
  passwordConfirmError.value = "";
  submitError.value = "";
  submitSuccess.value = "";

  if (email.value !== confirmEmail.value) {
    emailConfirmError.value = "Emails do not match";
  }

  if (password.value !== confirmPassword.value) {
    passwordConfirmError.value = "Passwords do not match";
  }

  if (emailConfirmError.value || passwordConfirmError.value) return;

  loading.value = true;
  try {
    const res = await fetch("http://localhost:3000/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: `${firstName.value.trim()} ${lastName.value.trim()}`.trim(),
        email: email.value,
        password: password.value,
      }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Signup failed");

    submitSuccess.value = "Account created successfully";

    if (data.accessToken) {
      setSession(data.accessToken);
    }

    if (fetchCurrentUser) {
      await fetchCurrentUser();
    }

    setTimeout(() => {
      close();
    }, 5000);
    console.log("User created", data.user);
  } catch (err) {
    submitError.value = "Please enter a valid email and password";
  } finally {
    loading.value = false;
  }
}

defineExpose({
  open,
  close,
  clearSession,
});
</script>

<style>
@import "./DialogUtils.css";
</style>
