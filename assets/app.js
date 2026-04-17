const SyntraApp = (() => {
    const SUPABASE_URL = "https://awbhbetmkofxpnsboien.supabase.co";
    const SUPABASE_KEY = "sb_publishable_g8cHXb2qE1WOsiBy3YQvdg_zwaNBYMG";
    const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    const pages = [
        { key: "dashboard", label: "Dashboard", href: "dashboard.html" },
        { key: "groups", label: "Groups", href: "groups.html" },
        { key: "students", label: "Students", href: "students.html" },
        { key: "payment", label: "Payments", href: "payment.html" },
        { key: "leads", label: "Leads", href: "leads.html" }
    ];

    function qs(selector, root = document) {
        return root.querySelector(selector);
    }

    function qsa(selector, root = document) {
        return [...root.querySelectorAll(selector)];
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function formatMoney(value) {
        const amount = Number(value || 0);
        return `${amount.toLocaleString("uz-UZ")} so'm`;
    }

    function formatDate(value) {
        if (!value) return "No date";
        return new Date(value).toLocaleDateString("uz-UZ", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    function withWorkspace(href, slug) {
        if (!slug) return href;
        return `${href}?ws=${encodeURIComponent(slug)}`;
    }

    function getWorkspaceSlug() {
        return new URLSearchParams(window.location.search).get("ws");
    }

    function parseError(error, fallback = "Unexpected error") {
        return error?.message || fallback;
    }

    function setButtonLoading(button, loading, label) {
        if (!button) return;
        if (loading) {
            button.dataset.originalLabel = button.textContent;
            button.disabled = true;
            button.textContent = label || "Loading...";
            return;
        }

        button.disabled = false;
        if (button.dataset.originalLabel) {
            button.textContent = button.dataset.originalLabel;
            delete button.dataset.originalLabel;
        }
    }

    function showToast(title, message = "", type = "success") {
        let stack = qs("#toastStack");
        if (!stack) {
            stack = document.createElement("div");
            stack.id = "toastStack";
            stack.className = "toast-stack";
            document.body.appendChild(stack);
        }

        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<strong>${escapeHtml(title)}</strong><p>${escapeHtml(message)}</p>`;
        stack.appendChild(toast);

        window.setTimeout(() => {
            toast.remove();
        }, 3200);
    }

    function renderSidebar({ pageKey, workspace, user }) {
        const sidebar = qs("#sidebar");
        if (!sidebar) return;

        sidebar.innerHTML = `
            <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px;">
                <div class="brand">
                    <img class="brand-logo" src="assets/syntraavatar.png" alt="SyntraAI">
                    <div class="brand-mark">
                        <div class="brand-name">SyntraAI</div>
                        <div class="brand-subtitle">Education operating system</div>
                    </div>
                </div>
                <button class="btn btn-ghost" id="closeSidebar" type="button" style="min-height:42px; padding:0 14px;">Close</button>
            </div>
            <div class="workspace-pill">${escapeHtml(workspace?.name || "Workspace")}</div>
            <nav class="sidebar-nav">
                ${pages.map((page) => `
                    <a class="nav-link ${page.key === pageKey ? "active" : ""}" href="${withWorkspace(page.href, workspace?.slug)}">
                        <span class="nav-dot"></span>
                        <span>${page.label}</span>
                    </a>
                `).join("")}
            </nav>
            <div class="sidebar-footer">
                <div class="user-card">
                    <div class="user-label">Signed in</div>
                    <div class="user-email">${escapeHtml(user?.email || "No email")}</div>
                </div>
                <a class="btn btn-secondary btn-block" href="workspace-create.html">Workspaces</a>
                <button class="btn btn-danger btn-block" id="signOutBtn" type="button">Sign out</button>
            </div>
        `;

        const signOutBtn = qs("#signOutBtn");
        signOutBtn?.addEventListener("click", async () => {
            await sb.auth.signOut();
            window.location.href = "index.html";
        });
    }

    function wireMobileMenu() {
        const openBtn = qs("#openSidebar");
        const closeBtn = qs("#closeSidebar");

        openBtn?.addEventListener("click", () => {
            document.body.classList.add("sidebar-open");
        });

        closeBtn?.addEventListener("click", () => {
            document.body.classList.remove("sidebar-open");
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                document.body.classList.remove("sidebar-open");
            }
        });
    }

    function setTopbarMeta({ workspace }) {
        const badge = qs("#workspaceBadge");
        if (badge) {
            badge.textContent = workspace?.name || "Workspace";
        }
    }

    function openModal(id) {
        const modal = document.getElementById(id);
        if (!modal) return;
        modal.classList.add("open");
        document.body.classList.add("modal-open");
    }

    function closeModal(id) {
        const modal = document.getElementById(id);
        if (!modal) return;
        modal.classList.remove("open");
        if (!qsa(".modal.open").length) {
            document.body.classList.remove("modal-open");
        }
    }

    function wireModalDismiss() {
        qsa("[data-close-modal]").forEach((button) => {
            button.addEventListener("click", () => closeModal(button.dataset.closeModal));
        });

        qsa(".modal").forEach((modal) => {
            modal.addEventListener("click", (event) => {
                if (event.target === modal) {
                    closeModal(modal.id);
                }
            });
        });

        document.addEventListener("keydown", (event) => {
            if (event.key !== "Escape") return;
            qsa(".modal.open").forEach((modal) => closeModal(modal.id));
        });
    }

    function emptyState(title, message) {
        return `
            <div class="empty-state">
                <h3>${escapeHtml(title)}</h3>
                <p>${escapeHtml(message)}</p>
            </div>
        `;
    }

    function loadingState(title = "Loading", message = "Fetching data...") {
        return `
            <div class="loading-state">
                <h3>${escapeHtml(title)}</h3>
                <p>${escapeHtml(message)}</p>
            </div>
        `;
    }

    function csvEscape(value) {
        const stringValue = String(value ?? "");
        return `"${stringValue.replace(/"/g, "\"\"")}"`;
    }

    function exportCsv(filename, headers, rows) {
        const csv = [
            headers.map(csvEscape).join(","),
            ...rows.map((row) => row.map(csvEscape).join(","))
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(link.href);
    }

    async function assignStudentsToGroup(groupId, studentIds, workspaceId) {
        const existing = await sb
            .from("group_students")
            .select("student_id")
            .eq("group_id", groupId)
            .eq("workspace_id", workspaceId);

        if (existing.error) {
            return { error: existing.error };
        }

        const currentIds = new Set(existing.data.map((item) => item.student_id));
        const toInsert = studentIds
            .filter((studentId) => !currentIds.has(studentId))
            .map((studentId) => ({
                group_id: groupId,
                student_id: studentId,
                workspace_id: workspaceId,
                status: "active",
                created_at: new Date().toISOString()
            }));

        const toDelete = existing.data
            .filter((item) => !studentIds.includes(item.student_id))
            .map((item) => item.student_id);

        if (toDelete.length) {
            const remove = await sb
                .from("group_students")
                .delete()
                .eq("group_id", groupId)
                .in("student_id", toDelete)
                .eq("workspace_id", workspaceId);

            if (remove.error) {
                return { error: remove.error };
            }
        }

        if (toInsert.length) {
            const insert = await sb.from("group_students").insert(toInsert);
            if (insert.error) {
                return { error: insert.error };
            }
        }

        return { data: true };
    }

    async function requireWorkspace(pageKey) {
        const { data: { session } } = await sb.auth.getSession();
        if (!session) {
            window.location.href = "index.html";
            return null;
        }

        const { data: { user } } = await sb.auth.getUser();
        const slug = getWorkspaceSlug();
        if (!slug) {
            if (pageKey === "subscription") {
                return { session, user, workspace: null, slug: null };
            }
            window.location.href = "workspace-create.html";
            return null;
        }

        const { data: workspace, error } = await sb
            .from("workspaces")
            .select("*")
            .eq("slug", slug)
            .single();

        if (error || !workspace) {
            showToast("Workspace not found", parseError(error, "Select another workspace"), "error");
            window.location.href = "workspace-create.html";
            return null;
        }

        const subscribed = workspace.subscribed === false ? false : true;
        if (!subscribed && pageKey !== "subscription") {
            window.location.href = "subscription.html";
            return null;
        }

        renderSidebar({ pageKey, workspace, user });
        setTopbarMeta({ workspace });
        wireMobileMenu();
        wireModalDismiss();

        return { session, user, workspace, slug };
    }

    function statCard(label, value, meta = "") {
        return `
            <div class="metric-card">
                <div class="metric-label">${escapeHtml(label)}</div>
                <div class="metric-value">${escapeHtml(value)}</div>
                <div class="metric-meta">${escapeHtml(meta)}</div>
            </div>
        `;
    }

    return {
        sb,
        qs,
        qsa,
        escapeHtml,
        formatMoney,
        formatDate,
        parseError,
        setButtonLoading,
        showToast,
        withWorkspace,
        getWorkspaceSlug,
        openModal,
        closeModal,
        emptyState,
        loadingState,
        exportCsv,
        assignStudentsToGroup,
        requireWorkspace,
        statCard
    };
})();
