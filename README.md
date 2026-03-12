<div align="center">

# GitHub Explorer

**A GitHub Dark-themed repository browser built with vanilla HTML, CSS, and JavaScript.**  
Search any GitHub user and instantly explore their public repositories — sorted by stars, enriched with language colors, topics, and live statistics.

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![GitHub API](https://img.shields.io/badge/GitHub_REST_API-v3-30363d?style=flat-square&logo=github)

</div>

---

## Data Flow

Step-by-step journey from a button click to cards appearing on screen:

```mermaid
graph TB
    START([User types username\nand clicks Search])
    TRIM{Input empty\nafter trim?}
    LOAD[UI.showLoading\nDisable button\nClear grid]
    PARALLEL[Promise.all — run in parallel]
    FU[fetchUser\nGET /users/:username]
    FR[fetchRepos\nGET /users/:username/repos\nper_page=100 · sort=updated]
    ERR_USER{response.ok?}
    ERR_REPO{response.ok?}
    E404[Throw — User not found]
    E403[Throw — Rate limit exceeded]
    EGENERIC[Throw — API error]
    PROFILE[renderUserProfile\nAvatar · Name · Bio\nLocation · Company\nFollowers · Following]
    SORT[Sort repos array\n1st — stargazers_count DESC\n2nd — updated_at DESC]
    RENDER[renderRepos\nCreate DocumentFragment]

    subgraph CARD_LOOP["For each repo — createRepoCard(repo, index)"]
        CL1{repo.language\nexists?}
        CL2[Use repo.language]
        CL3[getData\nGET /repos/:owner/:repo/languages\nPick first key]
        CL4[Look up LANGUAGE_COLORS]
        CL5[Build card innerHTML\nwith escapeHtml on all API text]
    end

    APPEND[Append fragment\nto DOM — single reflow]
    SHOW[UI.showResults]
    CATCH[UI.showError\ntitle + message]
    FINALLY[Re-enable button]
    END([Cards visible\non screen])

    START --> TRIM
    TRIM -->|Yes| START
    TRIM -->|No| LOAD
    LOAD --> PARALLEL
    PARALLEL --> FU & FR
    FU --> ERR_USER
    FR --> ERR_REPO
    ERR_USER -->|No · 404| E404
    ERR_USER -->|No · 403| E403
    ERR_USER -->|No · other| EGENERIC
    ERR_REPO -->|No · 403| E403
    ERR_REPO -->|No · other| EGENERIC
    ERR_USER -->|Yes| PROFILE
    ERR_REPO -->|Yes| SORT
    E404 & E403 & EGENERIC --> CATCH
    PROFILE & SORT --> RENDER
    RENDER --> CL1
    CL1 -->|Yes| CL2
    CL1 -->|No — fork| CL3
    CL2 & CL3 --> CL4
    CL4 --> CL5
    CL5 --> APPEND
    APPEND --> SHOW
    CATCH --> FINALLY
    SHOW --> FINALLY
    FINALLY --> END
```

---

## UI State Machine

The `UI` object enforces that only **one** state panel is visible at a time. The CSS class `is-active` drives `display: flex` visibility:

```mermaid
graph TB
    IDLE([Idle\nNo panels visible])
    LOADING([Loading\nSpinner shown])
    ERROR([Error\nError card shown])
    EMPTY([Empty\nEmpty card + Profile shown])
    RESULTS([Results\nProfile + Repos Grid shown])

    IDLE -->|searchUser called| LOADING
    LOADING -->|fetch failed| ERROR
    LOADING -->|repos.length === 0| EMPTY
    LOADING -->|repos.length > 0| RESULTS
    ERROR -->|new search| LOADING
    EMPTY -->|new search| LOADING
    RESULTS -->|new search| LOADING
    RESULTS -->|input cleared| IDLE
    ERROR -->|input cleared| IDLE
```

---

## API Layer

Three functions cover all network requests:

```mermaid
graph TB
    A[fetchUser\nasync function]
    B["GET https://api.github.com\n/users/:username"]
    C{Status}
    D[Return user JSON\nname · login · avatar_url\nbio · location · company\nfollowers · following · html_url]
    E[404 → User not found]
    F[403 → Rate limit exceeded]
    G[Other → API error]

    H[fetchRepos\nasync function]
    I["GET https://api.github.com\n/users/:username/repos\n?per_page=100&sort=updated"]
    J[Return repos array\nname · description · html_url\nlanguage · topics · visibility\nstargazers_count · forks_count\nupdated_at · full_name]

    K[getData\nfor forked repos]
    L["GET https://api.github.com\n/repos/:owner/:repo/languages"]
    M[Return first key\nfrom language byte map]

    A --> B --> C
    C -->|ok| D
    C -->|404| E
    C -->|403| F
    C -->|other| G

    H --> I --> J

    K --> L --> M
```