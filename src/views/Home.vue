<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../supabase'
import { useRouter } from 'vue-router'

const router = useRouter()

// LOGOUT
const logout = async () => {
  await supabase.auth.signOut()
  router.push('/')
}

// FORM FIELDS
const sport = ref('')
const grad = ref('')
const adresa = ref('')
const opis = ref('')
const datum = ref('')

const validationError = ref('')
const errorMsg = ref('')
const successMsg = ref('')

const objave = ref([])

// EDIT STATE
const editingId = ref(null)
const editedOpis = ref('')
const currentUserId = ref(null)

// FETCH OBJAVE + DOLAZCI
const fetchObjave = async () => {
  const { data, error } = await supabase
    .from('objave')
    .select(`
      id,
      sport,
      grad,
      adresa,
      opis,
      datum,
      broj_dolazaka,
      created_at,
      user_id,
      korisnici ( ime, prezime ),
      dolazci ( user_id )
    `)
    .order('created_at', { ascending: false })

  if (!error) {
    objave.value = data
  }
}

// ADD OBJAVA (VALIDACIJA)
const addObjava = async () => {
  validationError.value = ''
  errorMsg.value = ''
  successMsg.value = ''

  const sportVal = sport.value.trim()
  const gradVal = grad.value.trim()
  const adresaVal = adresa.value.trim()
  const datumVal = datum.value

  if (!sportVal || !gradVal || !adresaVal || !datumVal) {
    validationError.value = 'Molimo ispunite sva obavezna polja (osim opisa).'
    return
  }

  const { data: sessionData } = await supabase.auth.getSession()
  const user = sessionData.session.user

  try {
    const { error } = await supabase.from('objave').insert({
      sport: sportVal,
      grad: gradVal,
      adresa: adresaVal,
      opis: opis.value.trim() || null,
      datum: datumVal,
      broj_dolazaka: 0,
      user_id: user.id
    })

    if (error) throw error

    successMsg.value = 'Objava dodana'

    sport.value = ''
    grad.value = ''
    adresa.value = ''
    opis.value = ''
    datum.value = ''

    fetchObjave()
  } catch (err) {
    errorMsg.value = err.message
  }
}

// JOIN LOGIC
const canJoin = (objava) => {
  if (objava.user_id === currentUserId.value) return false
  return !objava.dolazci.some(d => d.user_id === currentUserId.value)
}

const joinObjava = async (objava) => {
  try {
    // 1️⃣ upis u dolazci
    await supabase.from('dolazci').insert({
      objava_id: objava.id,
      user_id: currentUserId.value
    })

    // 2️⃣ dohvat trenutne vrijednosti iz baze
    const { data, error } = await supabase
      .from('objave')
      .select('broj_dolazaka')
      .eq('id', objava.id)
      .single()

    if (error) throw error

    // 3️⃣ update s točnom vrijednošću
    await supabase
      .from('objave')
      .update({
        broj_dolazaka: data.broj_dolazaka + 1
      })
      .eq('id', objava.id)

    fetchObjave()
  } catch (err) {
    alert('Već si označen/a kao dolazak.')
  }
}


// EDIT LOGIC
const startEdit = (objava) => {
  editingId.value = objava.id
  editedOpis.value = objava.opis
}

const cancelEdit = () => {
  editingId.value = null
  editedOpis.value = ''
}

const saveEdit = async (id) => {
  await supabase
    .from('objave')
    .update({ opis: editedOpis.value })
    .eq('id', id)

  cancelEdit()
  fetchObjave()
}

// DELETE
const deleteObjava = async (id) => {
  if (!confirm('Jesi siguran/na da želiš obrisati objavu?')) return

  await supabase
    .from('objave')
    .delete()
    .eq('id', id)

  fetchObjave()
}

onMounted(async () => {
  const { data } = await supabase.auth.getSession()
  currentUserId.value = data.session.user.id
  fetchObjave()
})
</script>

<template>
    <div>
  <!-- HEADER -->
  <nav class="navbar navbar-dark bg-primary px-3">
    <div class="container-fluid">
      <button class="btn btn-outline-light" @click="logout">Odjava</button>
      <span class="navbar-brand ms-3">Sportsy</span>
    </div>
  </nav>

  <!-- CONTENT -->
  <div class="container mt-4">

    <!-- FORMA -->
    <div class="card shadow mb-4">
      <form class="card-body" @submit.prevent="addObjava">
        <h5 class="card-title mb-3">Nova objava</h5>

        <div class="row g-2">
          <div class="col-md-6">
            <input v-model="sport" class="form-control" placeholder="Sport *" />
          </div>

          <div class="col-md-6">
            <input v-model="grad" class="form-control" placeholder="Grad *" />
          </div>

          <div class="col-md-12">
            <input v-model="adresa" class="form-control" placeholder="Adresa *" />
          </div>

          <div class="col-md-12">
            <textarea v-model="opis" class="form-control" placeholder="Opis (opcionalno)"></textarea>
          </div>

          <div class="col-md-4">
            <input v-model="datum" type="date" class="form-control" />
          </div>
        </div>

        <button type="submit" class="btn btn-success mt-3">Objavi</button>

        <div v-if="validationError" class="alert alert-danger mt-3">
          {{ validationError }}
        </div>

        <div v-if="successMsg" class="alert alert-success mt-3">
          {{ successMsg }}
        </div>

        <div v-if="errorMsg" class="alert alert-danger mt-3">
          {{ errorMsg }}
        </div>
      </form>
    </div>

    <!-- LISTA OBJAVA -->
    <div v-for="objava in objave" :key="objava.id" class="card mb-3">
      <div class="card-body">
        <h5 class="card-title">
          {{ objava.sport }} – {{ objava.grad }}
        </h5>

        <h6 class="card-subtitle mb-2 text-muted">
          {{ objava.adresa }} | {{ objava.datum }}
        </h6>

        <div class="d-flex align-items-center gap-3 mb-2">
          <span class="badge bg-info">
            Dolazi: {{ objava.broj_dolazaka }}
          </span>

          <button
            v-if="canJoin(objava)"
            class="btn btn-sm btn-outline-success"
            @click="joinObjava(objava)"
          >
            +
          </button>
        </div>

        <p v-if="editingId !== objava.id">
          {{ objava.opis || 'Bez opisa' }}
        </p>

        <div v-else class="mb-2">
          <textarea v-model="editedOpis" class="form-control"></textarea>
        </div>

        <small class="text-muted d-block mb-2">
          Objavio: {{ objava.korisnici?.ime }} {{ objava.korisnici?.prezime }}
        </small>

        <div v-if="objava.user_id === currentUserId">
          <button
            v-if="editingId !== objava.id"
            class="btn btn-sm btn-outline-primary me-2"
            @click="startEdit(objava)"
          >
            Uredi
          </button>

          <button
            v-if="editingId === objava.id"
            class="btn btn-sm btn-success me-2"
            @click="saveEdit(objava.id)"
          >
            Spremi
          </button>

          <button
            v-if="editingId === objava.id"
            class="btn btn-sm btn-secondary me-2"
            @click="cancelEdit"
          >
            Odustani
          </button>

          <button
            class="btn btn-sm btn-outline-danger"
            @click="deleteObjava(objava.id)"
          >
            Obriši
          </button>
        </div>
      </div>
    </div>

  </div>

  </div>
</template>
