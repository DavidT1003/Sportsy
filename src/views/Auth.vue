<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase'

const router = useRouter()

const isLogin = ref(true)

const email = ref('')
const password = ref('')
const ime = ref('')
const prezime = ref('')
const errorMsg = ref('')
const successMsg = ref('')

const toggleMode = () => {
  isLogin.value = !isLogin.value
  errorMsg.value = ''
  successMsg.value = ''
}

// REGISTRACIJA

const register = async () => {
  errorMsg.value = ''
  successMsg.value = ''

  try {
    // 1️⃣ Registracija
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.value,
      password: password.value
    })

    if (signUpError) throw signUpError

    // 2️⃣ ODMAH login (OVO STVARA SESSION)
    const { data: loginData, error: loginError } =
      await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value
      })

    if (loginError) throw loginError

    const user = loginData.user

    // 3️⃣ Sad session postoji → INSERT PROLAZI
    const { error: dbError } = await supabase
      .from('korisnici')
      .insert({
        id: user.id,
        ime: ime.value,
        prezime: prezime.value
      })

    if (dbError) throw dbError

    successMsg.value = 'Registracija uspješna'
    router.push('/home')
  } catch (err) {
    errorMsg.value = err.message
  }
}


// PRIJAVA
const login = async () => {
  errorMsg.value = ''
  successMsg.value = ''

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })

    if (error) throw error

    router.push('/home')
  } catch (err) {
    errorMsg.value = err.message
  }
}
</script>

<template>
  <div class="container vh-100 d-flex justify-content-center align-items-center">
    <div class="card shadow p-4" style="width: 100%; max-width: 400px">
      
      <h3 class="text-center mb-4">
        {{ isLogin ? 'Prijava' : 'Registracija' }}
      </h3>

      <div v-if="!isLogin" class="mb-3">
        <input v-model="ime" class="form-control mb-2" placeholder="Ime" />
        <input v-model="prezime" class="form-control" placeholder="Prezime" />
      </div>

      <div class="mb-3">
        <input v-model="email" class="form-control" placeholder="Email" />
      </div>

      <div class="mb-3">
        <input
          v-model="password"
          type="password"
          class="form-control"
          placeholder="Lozinka"
        />
      </div>

      <div class="d-grid gap-2">
        <button
          v-if="isLogin"
          class="btn btn-primary"
          @click="login"
        >
          Prijavi se
        </button>

        <button
          v-else
          class="btn btn-success"
          @click="register"
        >
          Registriraj se
        </button>
      </div>

      <div v-if="successMsg" class="alert alert-success mt-3">
        {{ successMsg }}
      </div>

      <div v-if="errorMsg" class="alert alert-danger mt-3">
        {{ errorMsg }}
      </div>

      <hr />

      <div class="text-center">
        <button class="btn btn-link" @click="toggleMode">
          {{ isLogin
            ? 'Nemaš račun? Registriraj se'
            : 'Već imaš račun? Prijavi se'
          }}
        </button>
      </div>

    </div>
  </div>
</template>


