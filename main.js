const LANGUAGE_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  'C#': '#178600',
  C: '#555555',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Go: '#00ADD8',
  Rust: '#dea584',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Vue: '#41b883',
  Shell: '#89e051',
  PowerShell: '#012456',
  Scala: '#c22d40',
  'Jupyter Notebook': '#DA5B0B',
  R: '#198CE7',
  Lua: '#000080',
  Haskell: '#5e5086',
  Elixir: '#6e4a7e',
  Clojure: '#db5855',
  TSQL: '#b07219',
  default: '#8b949e',
};

const DOM = {
  input: document.getElementById('username-input'),
  searchBtn: document.getElementById('search-btn'),

  // State panels
  loadingState: document.getElementById('loading-state'),
  errorState: document.getElementById('error-state'),
  errorTitle: document.getElementById('error-title'),
  errorMessage: document.getElementById('error-message'),
  emptyState: document.getElementById('empty-state'),

  // User profile
  userProfile: document.getElementById('user-profile'),
  userAvatar: document.getElementById('user-avatar'),
  userName: document.getElementById('user-name'),
  userLogin: document.getElementById('user-login'),
  userBio: document.getElementById('user-bio'),
  userProfileLink: document.getElementById('user-profile-link'),
  userFollowersLink: document.getElementById('user-followers-link'),
  userFollowersCount: document.getElementById('user-followers-count'),
  userFollowingLink: document.getElementById('user-following-link'),
  userFollowingCount: document.getElementById('user-following-count'),
  userLocation: document.getElementById('user-location'),
  userLocationText: document.getElementById('user-location-text'),
  userCompany: document.getElementById('user-company'),
  userCompanyText: document.getElementById('user-company-text'),

  // Repos
  reposHeader: document.getElementById('repos-header'),
  reposCountBadge: document.getElementById('repos-count-badge'),
  reposGrid: document.getElementById('repos-grid'),
};

const UI = {
  // Called when a fetch starts — hide everything, show spinner
  showLoading() {
    DOM.loadingState.classList.add('is-active');
    DOM.errorState.classList.remove('is-active');
    DOM.emptyState.classList.remove('is-active');
    DOM.userProfile.classList.remove('is-active');
    DOM.reposHeader.classList.remove('is-active');
    DOM.reposGrid.innerHTML = '';
  },

  // Called when an API error occurs
  showError(title, message) {
    DOM.loadingState.classList.remove('is-active');
    DOM.errorState.classList.add('is-active');
    DOM.errorTitle.textContent = title;
    DOM.errorMessage.textContent = message;
  },

  // Called when the user has 0 public repos
  showEmpty() {
    DOM.loadingState.classList.remove('is-active');
    DOM.emptyState.classList.add('is-active');
    DOM.userProfile.classList.add('is-active');
    DOM.reposHeader.classList.add('is-active');
  },

  // Called when everything loaded OK
  showResults() {
    DOM.loadingState.classList.remove('is-active');
    DOM.errorState.classList.remove('is-active');
    DOM.emptyState.classList.remove('is-active');
    DOM.userProfile.classList.add('is-active');
    DOM.reposHeader.classList.add('is-active');
  },

  // Called when input is cleared
  hideAll() {
    DOM.loadingState.classList.remove('is-active');
    DOM.errorState.classList.remove('is-active');
    DOM.emptyState.classList.remove('is-active');
    DOM.userProfile.classList.remove('is-active');
    DOM.reposHeader.classList.remove('is-active');
    DOM.reposGrid.innerHTML = '';
  },
};

const API_BASE = 'https://api.github.com';

// MAIN SEARCH FUNCTION
async function searchUser(username) {
  const trimmedUserName = username.trim();
  if (!trimmedUserName) return;

  UI.showLoading();
  DOM.searchBtn.disabled = true;

  try {
    const [user, repos] = await Promise.all([
      fetchUser(trimmedUserName),
      fetchRepos(trimmedUserName)
    ]);

    renderUserProfile(user);

    // Make a New Array, Then Sort Data First By Starts, Second With Date.
    let sortedRepos = [...repos].sort((a, b) => {
      if (b.stargazers_count !== a.stargazers_count)
        return b.stargazers_count - a.stargazers_count;

      return Date(b.updated_at) - Date(a.updated_at);
    })

    renderRepos(sortedRepos);
    UI.showResults();

  } catch (error) {
    UI.showError(
      "Something Went Wrong",
      error?.message || "Unexpected Error"
    );
  } finally {
    DOM.searchBtn.disabled = false;
  }
}

// API CALLS
async function fetchUser(username) {
  const response = await fetch(`${API_BASE}/users/${username}`);

  if (!response.ok) {
    if (response.status === 404)
      throw new Error(`User not found. Check the username and try again.`);
    if (response.status === 403)
      throw new Error(`GitHub API rate limit exceeded. Please wait a moment and try again.`);

    throw new Error(`GitHub API error (status ${response.status}).`);
  }

  return response.json();
}

async function fetchRepos(username) {
  // 100 Per Page Is Allowed By Github.
  const response = await fetch(`${API_BASE}/users/${username}/repos?per_page=100&sort=updated&type=owner`);

  if (!response.ok) {
    if (response.status === 403)
      throw new Error(`GitHub API rate limit exceeded. Please wait a moment and try again.`);

    throw new Error(`Failed to fetch repositories (status ${response.status}).`);
  }

  return response.json();
}

// RENDER HELPERS
function renderUserProfile(user) {
  DOM.userAvatar.src = user.avatar_url;
  DOM.userAvatar.alt = `${user.login}'s avatar`;
  DOM.userName.textContent = user.name || user.login;
  DOM.userLogin.textContent = user.login;

  DOM.userBio.textContent = user.bio;
  DOM.userBio.style.display = user.bio ? 'block' : 'none';

  if (user.location) {
    DOM.userLocation.style.diplay = 'flex';
    DOM.userLocationText.textContent = user.location;
  } else {
    DOM.userLocation.style.diplay = 'none';
  }

  if (user.company) {
    DOM.userCompany.style.diplay = 'flex';
    DOM.userCompanyText.textContent = user.company;
  } else {
    DOM.userCompany.style.diplay = 'none';
  }

  DOM.userProfileLink.href = user.html_url;
  DOM.userFollowersLink.href = `${user.html_url}?tab=followers`;
  DOM.userFollowingLink.href = `${user.html_url}?tab=following`;

  DOM.userFollowersCount.textContent = user.followers;
  DOM.userFollowingCount.textContent = user.following;
}

async function createRepoCard(repo, index) {
  const card = document.createElement("div");
  card.className = 'repo-card';
  card.style.animationDelay = `${index * 40}ms`;

  const langName = repo.language || await getData(repo);
  const langColor = LANGUAGE_COLORS[langName] || LANGUAGE_COLORS.default;
  const updatedStr = repo.updated_at;

  card.innerHTML = `
    <div class="repo-card-header">
      <a class="repo-name-link" href="${repo.html_url}" target="_blank">
        <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14" aria-hidden="true">
          <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"/>
        </svg>
        ${escapeHtml(repo.name)}
      </a>
      <span class="repo-visibility">${escapeHtml(repo.visibility || 'public')}</span>
    </div>

    <p class="repo-description">
      ${repo.description ? escapeHtml(repo.description) : '<em style="color:var(--fg-subtle)">No description provided.</em>'}
    </p>

    ${repo.topics && repo.topics.length > 0 ? `
      <div class="repo-topics">
        ${repo.topics.slice(0, 5).map((t) => `
          <a class="repo-topic" href="https://github.com/topics/${t}" target="_blank">
            ${escapeHtml(t)}
          </a>`).join('')}
      </div>` : ''}

    <div class="repo-card-footer">
      ${langName ? `
        <span class="repo-language">
          <span class="language-dot" style="background-color:${langColor}" aria-hidden="true"></span>
          <span>${escapeHtml(repo.language)}</span>
        </span>` : ''}
    </div>
  `
  console.log(langName);

  return card;
}

async function renderRepos(repos) {
  DOM.reposGrid.innerHTML = "";

  if (repos.length === 0) {
    UI.showEmpty();
    return;
  }

  DOM.reposCountBadge.textContent = repos.length;

  // Make a Virtual DOM Like 'React.js' To Add All Cards Once In DOM Not Make a Reflow & Repaint Repeated.
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < repos.length; i++) {
    const card = await createRepoCard(repos[i], i);
    fragment.appendChild(card);
  }

  DOM.reposGrid.appendChild(fragment);
}

// UTILITY FUNCTIONS
function formatDate(isoString) {
  const date = new Date(isoString);
  const diffDays = Math.floor((Date.now() - date) / 86_400_000);

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 365) return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Escape HTML special characters.
 * ALWAYS call this before putting API/user data into innerHTML!
 * Prevents XSS (Cross-Site Scripting) attacks.
 */
function escapeHtml(str) {
  const el = document.createElement('div');
  el.textContent = str;

  return el.innerHTML;
}

function getData(repo) {
  return fetch(`${API_BASE}/repos/${repo.full_name}/languages`)
    .then(res => res.json())
    .then(data => Object.keys(data)[0]);
}

// Click the Search button
DOM.searchBtn.addEventListener('click', () => {
  searchUser(DOM.input.value);
});

// Press Enter inside the input
DOM.input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') searchUser(DOM.input.value);
});

// Clear results when input is cleared
DOM.input.addEventListener('input', () => {
  if (DOM.input.value === '') UI.hideAll();
});