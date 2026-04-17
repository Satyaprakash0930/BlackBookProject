import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyArm2_N2ltPBSgUawm3C8rPjz8AijX8Uhc",
  authDomain: "codequest-9a113.firebaseapp.com",
  projectId: "codequest-9a113",
  storageBucket: "codequest-9a113.firebasestorage.app",
  messagingSenderId: "855684088397",
  appId: "1:855684088397:web:041f4555b42b284074d204",
  measurementId: "G-P53R0C4W0V"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// ===== AUTH STATE =====
onAuthStateChanged(auth, async (user) => {
  if (user) {
    window.currentUser = user;
    await ensureUserDoc(user);
    await loadUserData(user.uid);
    updateNavbar(user);
    showScreen('startScreen');
  } else {
    window.currentUser = null;
    showScreen('authScreen');
  }
});

// ===== ENSURE USER DOC EXISTS =====
async function ensureUserDoc(user) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      displayName: user.displayName || user.email.split('@')[0],
      email: user.email,
      photoURL: user.photoURL || '',
      totalXP: 0,
      totalCorrect: 0,
      totalAnswered: 0,
      streak: 0,
      lastPlayedDate: null,
      progress: { JavaScript: 1, Python: 1, HTML: 1, CSS: 1 },
      createdAt: serverTimestamp()
    });
  }
}

// ===== LOAD USER DATA =====
async function loadUserData(uid) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data();
    window.progress = data.progress || { JavaScript: 1, Python: 1, HTML: 1, CSS: 1 };
    window.totalScore = data.totalXP || 0;
    window.userStreak = data.streak || 0;
    window.totalCorrect = data.totalCorrect || 0;
    window.totalAnswered = data.totalAnswered || 0;
    if (window.currentUser) window.currentUser.emoji = data.emoji || '🧑‍💻';

    // Update streak based on last played date
    const today = new Date().toDateString();
    const lastPlayed = data.lastPlayedDate;
    if (lastPlayed) {
      const last = new Date(lastPlayed);
      const diff = Math.floor((new Date() - last) / (1000 * 60 * 60 * 24));
      if (diff > 1) {
        window.userStreak = 0;
        await updateDoc(ref, { streak: 0 });
      }
    }

    // Update UI
    const xpEl = document.getElementById('homeXP');
    if (xpEl) xpEl.textContent = window.totalScore;
    const streakEl = document.getElementById('streakCount');
    if (streakEl) streakEl.textContent = window.userStreak;
    if (typeof renderStars === 'function') renderStars();
  }
}

// ===== UPDATE NAVBAR =====
function updateNavbar(user) {
  const nameEl = document.getElementById('userName');
  const avatarEl = document.getElementById('userAvatar');
  const name = user.displayName || user.email.split('@')[0];
  if (nameEl) nameEl.textContent = name;
  if (avatarEl) {
    const emoji = window.currentUser?.emoji || '🧑‍💻';
    avatarEl.textContent = emoji;
    avatarEl.style.fontSize = '1.1rem';
    avatarEl.style.backgroundImage = '';
  }
}

// ===== SAVE PROGRESS TO FIREBASE =====
window.saveProgressToFirebase = async function(levelXP, correctInLevel, totalInLevel) {
  if (!window.currentUser) return;
  const uid = window.currentUser.uid;
  const ref = doc(db, 'users', uid);
  const today = new Date().toDateString();

  try {
    const snap = await getDoc(ref);
    const data = snap.data();
    const lastPlayed = data.lastPlayedDate;
    let newStreak = data.streak || 0;

    if (lastPlayed !== today) {
      const last = lastPlayed ? new Date(lastPlayed) : null;
      const diff = last ? Math.floor((new Date() - last) / (1000 * 60 * 60 * 24)) : 999;
      newStreak = diff === 1 ? newStreak + 1 : 1;
    }

    window.userStreak = newStreak;

    await updateDoc(ref, {
      totalXP: increment(levelXP),
      totalCorrect: increment(correctInLevel),
      totalAnswered: increment(totalInLevel),
      streak: newStreak,
      lastPlayedDate: today,
      progress: window.progress
    });

    // Update UI
    const xpEl = document.getElementById('homeXP');
    if (xpEl) xpEl.textContent = window.totalScore;
    const streakEl = document.getElementById('streakCount');
    if (streakEl) streakEl.textContent = newStreak;
    const victoryStreak = document.getElementById('victoryStreak');
    if (victoryStreak) victoryStreak.textContent = `🔥${newStreak}`;

  } catch(e) {
    console.error('Save error:', e);
  }
};

// ===== LOAD LEADERBOARD =====
window.loadLeaderboard = async function() {
  const container = document.getElementById('leaderboardList');
  if (!container) return;
  container.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Loading rankings...</p></div>';

  try {
    const q = query(collection(db, 'users'), orderBy('totalXP', 'desc'), limit(20));
    const snap = await getDocs(q);
    const currentUid = window.currentUser?.uid;

    if (snap.empty) {
      container.innerHTML = '<p style="text-align:center;color:var(--text-dim);padding:40px">No players yet. Be the first!</p>';
      return;
    }

    let html = '';
    let rank = 1;
    snap.forEach(d => {
      const u = d.data();
      const isMe = d.id === currentUid;
      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
      const avatarContent = u.emoji || '🧑‍💻';
      html += `
        <div class="lb-row ${isMe ? 'lb-me' : ''}">
          <div class="lb-rank">${medal}</div>
          <div class="lb-avatar">${avatarContent}</div>
          <div class="lb-info">
            <div class="lb-name">${u.displayName || 'Anonymous'}${isMe ? ' (You)' : ''}</div>
            <div class="lb-stats">${u.totalCorrect || 0} correct · ${u.streak || 0}🔥 streak</div>
          </div>
          <div class="lb-xp">${(u.totalXP || 0).toLocaleString()} XP</div>
        </div>`;
      rank++;
    });
    container.innerHTML = html;
  } catch(e) {
    container.innerHTML = `<p style="text-align:center;color:var(--red);padding:40px">Error loading leaderboard.</p>`;
    console.error(e);
  }
};

// ===== EMAIL LOGIN =====
window.loginWithEmail = async function() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  const btn = document.getElementById('loginBtnText');
  errEl.classList.add('hidden');
  btn.textContent = 'Signing in...';
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch(e) {
    errEl.textContent = friendlyError(e.code);
    errEl.classList.remove('hidden');
    btn.textContent = 'Login';
  }
};

// ===== EMAIL REGISTER =====
window.registerWithEmail = async function() {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const errEl = document.getElementById('regError');
  const btn = document.getElementById('regBtnText');
  errEl.classList.add('hidden');
  if (!name) { errEl.textContent = 'Please enter your name.'; errEl.classList.remove('hidden'); return; }
  if (!email) { errEl.textContent = 'Please enter your email.'; errEl.classList.remove('hidden'); return; }
  if (password.length < 6) { errEl.textContent = 'Password must be at least 6 characters.'; errEl.classList.remove('hidden'); return; }
  btn.textContent = 'Creating account...';

  let cred = null;
  try {
    cred = await createUserWithEmailAndPassword(auth, email, password);
  } catch(e) {
    console.error('Auth error:', e.code, e.message);
    errEl.textContent = friendlyError(e.code) + ' [' + (e.code || e.message) + ']';
    errEl.classList.remove('hidden');
    btn.textContent = 'Create Account';
    return;
  }

  try {
    await updateProfile(cred.user, { displayName: name });
  } catch(e) {
    console.error('updateProfile error:', e.code, e.message);
  }

  try {
    const ref = doc(db, 'users', cred.user.uid);
    await setDoc(ref, {
      displayName: name,
      email: email,
      emoji: '🧑‍💻',
      totalXP: 0,
      totalCorrect: 0,
      totalAnswered: 0,
      streak: 0,
      lastPlayedDate: null,
      progress: { JavaScript: 1, Python: 1, HTML: 1, CSS: 1 },
      createdAt: serverTimestamp()
    });
  } catch(e) {
    console.error('Firestore error:', e.code, e.message);
  }

  window.currentUser = cred.user;
  window.currentUser.emoji = '🧑‍💻';
  window.progress = { JavaScript: 1, Python: 1, HTML: 1, CSS: 1 };
  window.totalScore = 0;
  window.userStreak = 0;
  updateNavbar(cred.user);
  showScreen('startScreen');
  btn.textContent = 'Create Account';
};

// ===== GOOGLE LOGIN =====
window.loginWithGoogle = async function() {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch(e) {
    console.error(e);
  }
};

// ===== LOGOUT =====
window.logoutUser = async function() {
  await signOut(auth);
};

// ===== AUTH TAB SWITCH =====
window.switchAuthTab = function(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.add('hidden'));
  if (tab === 'login') {
    document.querySelectorAll('.auth-tab')[0].classList.add('active');
    document.getElementById('loginForm').classList.remove('hidden');
  } else {
    document.querySelectorAll('.auth-tab')[1].classList.add('active');
    document.getElementById('registerForm').classList.remove('hidden');
  }
};

function friendlyError(code) {
  const map = {
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}

// ===== SHOW PROFILE =====
window.showProfile = async function() {
  showScreen('profileScreen');
  if (!window.currentUser) return;
  const uid = window.currentUser.uid;

  try {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data();

    // Avatar
    const avatarEl = document.getElementById('profileAvatarBig');
    const emoji = data.emoji || window.currentUser?.emoji || '🧑‍💻';
    if (window.currentUser) window.currentUser.emoji = emoji;
    avatarEl.textContent = emoji;

    // Name & email
    document.getElementById('profileDisplayName').textContent = data.displayName || 'Player';
    document.getElementById('profileEmail').textContent = data.email || '';

    // Join date
    if (data.createdAt) {
      const d = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
      document.getElementById('profileJoined').textContent = 'Joined ' + d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    // Stats
    const answered = data.totalAnswered || 0;
    const correct = data.totalCorrect || 0;
    const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
    document.getElementById('pstatXP').textContent = (data.totalXP || 0).toLocaleString();
    document.getElementById('pstatStreak').textContent = data.streak || 0;
    document.getElementById('pstatCorrect').textContent = correct.toLocaleString();
    document.getElementById('pstatAnswered').textContent = answered.toLocaleString();
    document.getElementById('pstatAccuracy').textContent = accuracy + '%';

    // Rank
    try {
      const q = query(collection(db, 'users'), orderBy('totalXP', 'desc'));
      const allSnap = await getDocs(q);
      let rank = 1;
      allSnap.forEach(d => { if (d.id === uid) return; if ((d.data().totalXP || 0) > (data.totalXP || 0)) rank++; });
      document.getElementById('pstatRank').textContent = '#' + rank;
    } catch(e) { document.getElementById('pstatRank').textContent = '#—'; }

    // Language progress bars
    const prog = data.progress || { JavaScript: 1, Python: 1, HTML: 1, CSS: 1 };
    ['JavaScript', 'Python', 'HTML', 'CSS'].forEach(lang => {
      const done = Math.min((prog[lang] || 1) - 1, 30);
      const pct = Math.round((done / 30) * 100);
      const bar = document.getElementById('plang-' + lang);
      const count = document.getElementById('plang-' + lang + '-count');
      if (bar) setTimeout(() => bar.style.width = pct + '%', 100);
      if (count) count.textContent = done + '/30';
    });

    // Achievements
    renderAchievements(data);

  } catch(e) { console.error('Profile load error:', e); }
};

// ===== ACHIEVEMENTS =====
function renderAchievements(data) {
  const grid = document.getElementById('achievementsGrid');
  if (!grid) return;

  const xp = data.totalXP || 0;
  const correct = data.totalCorrect || 0;
  const streak = data.streak || 0;
  const prog = data.progress || {};
  const jsLevels = Math.min((prog.JavaScript || 1) - 1, 30);
  const pyLevels = Math.min((prog.Python || 1) - 1, 30);
  const htmlLevels = Math.min((prog.HTML || 1) - 1, 30);
  const cssLevels = Math.min((prog.CSS || 1) - 1, 30);
  const totalLevels = jsLevels + pyLevels + htmlLevels + cssLevels;

  const achievements = [
    { icon: '🚀', name: 'First Steps', desc: 'Complete your first level', unlocked: totalLevels >= 1 },
    { icon: '🔥', name: 'On Fire', desc: '3-day streak', unlocked: streak >= 3 },
    { icon: '💯', name: 'Century', desc: 'Answer 100 questions', unlocked: correct >= 100 },
    { icon: '⭐', name: 'XP Hunter', desc: 'Earn 500 XP', unlocked: xp >= 500 },
    { icon: '🏅', name: 'Dedicated', desc: '7-day streak', unlocked: streak >= 7 },
    { icon: '🎯', name: 'Sharp Shooter', desc: 'Answer 500 questions', unlocked: correct >= 500 },
    { icon: '🐍', name: 'Pythonista', desc: 'Complete 10 Python levels', unlocked: pyLevels >= 10 },
    { icon: '⚡', name: 'JS Ninja', desc: 'Complete 10 JS levels', unlocked: jsLevels >= 10 },
    { icon: '🎨', name: 'Style Master', desc: 'Complete 10 CSS levels', unlocked: cssLevels >= 10 },
    { icon: '🌐', name: 'Web Architect', desc: 'Complete 10 HTML levels', unlocked: htmlLevels >= 10 },
    { icon: '👑', name: 'Legend', desc: 'Earn 5000 XP', unlocked: xp >= 5000 },
    { icon: '🏆', name: 'Grandmaster', desc: 'Complete all 120 levels', unlocked: totalLevels >= 120 },
  ];

  grid.innerHTML = achievements.map(a => `
    <div class="achievement ${a.unlocked ? 'unlocked' : 'locked'}">
      <div class="achievement-icon">${a.icon}</div>
      <div class="achievement-name">${a.name}</div>
      <div class="achievement-desc">${a.desc}</div>
    </div>
  `).join('');
}

// ===== EDIT DISPLAY NAME =====
window.toggleEditName = function() {
  const box = document.getElementById('editNameBox');
  box.classList.toggle('hidden');
  if (!box.classList.contains('hidden')) {
    document.getElementById('editNameInput').value = document.getElementById('profileDisplayName').textContent;
    document.getElementById('editNameInput').focus();
  }
};

window.saveDisplayName = async function() {
  const newName = document.getElementById('editNameInput').value.trim();
  const msgEl = document.getElementById('editNameMsg');
  if (!newName) return;
  try {
    await updateProfile(window.currentUser, { displayName: newName });
    const ref = doc(db, 'users', window.currentUser.uid);
    await updateDoc(ref, { displayName: newName });
    document.getElementById('profileDisplayName').textContent = newName;
    document.getElementById('userName').textContent = newName;
    msgEl.textContent = '✅ Name updated!';
    msgEl.style.color = 'var(--green)';
    msgEl.classList.remove('hidden');
    setTimeout(() => { msgEl.classList.add('hidden'); document.getElementById('editNameBox').classList.add('hidden'); }, 1500);
  } catch(e) {
    msgEl.textContent = '❌ Failed to update name.';
    msgEl.style.color = 'var(--red)';
    msgEl.classList.remove('hidden');
  }
};

// ===== EMOJI AVATAR SYSTEM =====
const AVATAR_EMOJIS = [
  '🧑‍💻','👨‍💻','👩‍💻','🧠','🚀','🦊','🐱','🐼','🐸','🦁',
  '🐯','🐺','🦝','🐻','🐨','🦄','🐙','🦋','🐬','🦅',
  '👾','🤖','👻','💀','🎭','🧙','🧛','🧜','🦸','🥷',
  '🎮','🕹️','⚡','🔥','💎','🌙','⭐','🌈','🍀','🎯'
];

window.toggleEmojiPicker = function() {
  const picker = document.getElementById('emojiPicker');
  const grid = document.getElementById('emojiGrid');
  if (picker.classList.contains('hidden')) {
    // Build grid
    const current = window.currentUser?.emoji || '🧑‍💻';
    grid.innerHTML = AVATAR_EMOJIS.map(e => `
      <button class="emoji-btn ${e === current ? 'selected' : ''}" onclick="selectEmoji('${e}')">${e}</button>
    `).join('');
    picker.classList.remove('hidden');
    // Close on outside click
    setTimeout(() => document.addEventListener('click', closeEmojiOnOutside), 10);
  } else {
    picker.classList.add('hidden');
  }
};

function closeEmojiOnOutside(e) {
  const picker = document.getElementById('emojiPicker');
  if (picker && !picker.contains(e.target) && !e.target.closest('.btn-change-photo')) {
    picker.classList.add('hidden');
    document.removeEventListener('click', closeEmojiOnOutside);
  }
}

window.selectEmoji = async function(emoji) {
  if (!window.currentUser) return;
  window.currentUser.emoji = emoji;

  // Update all avatars immediately
  applyEmojiToAvatars(emoji);

  // Close picker
  document.getElementById('emojiPicker').classList.add('hidden');
  document.removeEventListener('click', closeEmojiOnOutside);

  // Save to Firestore
  try {
    const ref = doc(db, 'users', window.currentUser.uid);
    await updateDoc(ref, { emoji });
  } catch(e) { console.error('Emoji save error:', e); }
};

function applyEmojiToAvatars(emoji) {
  const navAvatar = document.getElementById('userAvatar');
  if (navAvatar) { navAvatar.textContent = emoji; navAvatar.style.fontSize = '1.1rem'; }

  const bigAvatar = document.getElementById('profileAvatarBig');
  if (bigAvatar) { bigAvatar.textContent = emoji; }
}
