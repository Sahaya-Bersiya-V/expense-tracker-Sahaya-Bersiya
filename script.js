// Element references
const notification = document.getElementById("notification");
const typeError = document.getElementById("type-error");
const amountError = document.getElementById("amount-error");
const categoryError = document.getElementById("category-error");
const dateError = document.getElementById("date-error");
const descriptionError = document.getElementById("description-error");

const transactionForm = document.getElementById("transaction-form");
const typeInput = document.getElementById("type");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const descriptionInput = document.getElementById("description");

const transactionList = document.getElementById("transaction-list");
const totalIncomeElement = document.getElementById("total-income");
const totalExpensesElement = document.getElementById("total-expenses");
const balanceElement = document.getElementById("balance");

const typeFilter = document.getElementById("type-filter");
const categoryFilter = document.getElementById("category-filter");
const submitButton = document.getElementById("submit-btn");
const cancelEditButton = document.getElementById("cancel-edit-btn");
const currentDateElement = document.getElementById("current-date");

const monthlyExpenseElement = document.getElementById("monthly-expense");
const monthlyTransactionsElement = document.getElementById("monthly-transactions");
const topCategoryElement = document.getElementById("top-category");

const searchInput = document.getElementById("search-input");
const dateSearchInput = document.getElementById("date-search");
const exportButton = document.getElementById("export-btn");
const resetFiltersButton = document.getElementById("reset-filters");
const themeToggle = document.getElementById("theme-toggle");

// Current date, shown in header and used for the "monthly" summary
const today = new Date();
currentDateElement.textContent = today.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

// App state
let transactions = [];
let editingId = null;
let expenseChart = null;

// Load any previously saved transactions
const savedTransactions = localStorage.getItem("transactions");
if (savedTransactions) {
    try {
        transactions = JSON.parse(savedTransactions);
    } catch (error) {
        transactions = [];
        console.error("Unable to load transactions:", error);
    }
}

function saveTransactions() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
}

// Applies the search box, date search, and both dropdown filters together
function getFilteredTransactions() {
    const selectedType = typeFilter.value;
    const selectedCategory = categoryFilter.value;
    const selectedDate = dateSearchInput.value;
    const searchValue = searchInput.value.toLowerCase().trim();

    return transactions.filter(function (transaction) {
        const typeMatches = selectedType === "all" || transaction.type === selectedType;
        const categoryMatches = selectedCategory === "all" || transaction.category === selectedCategory;
        const dateMatches = !selectedDate || transaction.date === selectedDate;

        const searchMatches =
            !searchValue ||
            transaction.description.toLowerCase().includes(searchValue) ||
            transaction.category.toLowerCase().includes(searchValue) ||
            transaction.date.toLowerCase().includes(searchValue) ||
            String(transaction.amount).toLowerCase().includes(searchValue);

        return typeMatches && categoryMatches && searchMatches && dateMatches;
    });
}

function displayTransactions() {
    transactionList.innerHTML = "";

    const filteredTransactions = getFilteredTransactions();

    if (filteredTransactions.length === 0) {
        const searchActive = searchInput.value.trim() !== "";
        transactionList.innerHTML = `
            <div class="empty-message">
                <div class="empty-icon">${searchActive ? "🔍" : "₹"}</div>
                <h3>${searchActive ? "No matching transactions" : "No transactions found"}</h3>
                <p>${searchActive ? "Try a different search term or filter." : "Try adding a transaction or changing your filters."}</p>
            </div>
        `;
        return;
    }

    // Most recent first
    filteredTransactions.sort(function (a, b) {
        return new Date(b.date) - new Date(a.date);
    });

    filteredTransactions.forEach(function (transaction) {
        const transactionItem = document.createElement("div");
        transactionItem.className = "transaction-item";

        const sign = transaction.type === "income" ? "+" : "-";

        transactionItem.innerHTML = `
            <div class="transaction-info">
                <h4>${transaction.description}</h4>
                <p>${transaction.category} • ${transaction.date}</p>
            </div>
            <div>
                <span class="transaction-amount ${transaction.type}">${sign} ₹${Number(transaction.amount).toFixed(2)}</span>
                <span class="transaction-actions">
                    <button class="edit-btn" onclick="editTransaction(${transaction.id})">Edit</button>
                    <button class="delete-btn" onclick="deleteTransaction(${transaction.id})">Delete</button>
                </span>
            </div>
        `;

        transactionList.appendChild(transactionItem);
    });
}

function updateSummary() {
    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(function (transaction) {
        if (transaction.type === "income") {
            totalIncome += Number(transaction.amount);
        } else {
            totalExpenses += Number(transaction.amount);
        }
    });

    const balance = totalIncome - totalExpenses;

    totalIncomeElement.textContent = `₹${totalIncome.toFixed(2)}`;
    totalExpensesElement.textContent = `₹${totalExpenses.toFixed(2)}`;
    balanceElement.textContent = `₹${balance.toFixed(2)}`;
}

function updateMonthlySummary() {
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let monthlyExpense = 0;
    let monthlyTransactions = 0;
    const categoryTotals = {};

    transactions.forEach(function (transaction) {
        const transactionDate = new Date(transaction.date);
        const sameMonth = transactionDate.getMonth() === currentMonth;
        const sameYear = transactionDate.getFullYear() === currentYear;

        if (!sameMonth || !sameYear) return;

        monthlyTransactions++;

        if (transaction.type === "expense") {
            const amount = Number(transaction.amount);
            monthlyExpense += amount;
            categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + amount;
        }
    });

    monthlyExpenseElement.textContent = `₹${monthlyExpense.toFixed(2)}`;
    monthlyTransactionsElement.textContent = monthlyTransactions;

    let topCategory = "-";
    let highestAmount = 0;

    Object.keys(categoryTotals).forEach(function (category) {
        if (categoryTotals[category] > highestAmount) {
            highestAmount = categoryTotals[category];
            topCategory = category;
        }
    });

    topCategoryElement.textContent = topCategory;
}

function updateExpenseChart() {
    const categoryTotals = {};

    transactions.forEach(function (transaction) {
        if (transaction.type !== "expense") return;
        const amount = Number(transaction.amount);
        categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + amount;
    });

    const categories = Object.keys(categoryTotals);
    const amounts = Object.values(categoryTotals);
    const chartCanvas = document.getElementById("expense-chart");

    if (expenseChart) {
        expenseChart.destroy();
    }

    if (categories.length === 0) return;

    expenseChart = new Chart(chartCanvas, {
        type: "doughnut",
        data: {
            labels: categories,
            datasets: [{ data: amounts }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: "right" },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return " ₹" + Number(context.raw).toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

function clearErrors() {
    typeError.textContent = "";
    amountError.textContent = "";
    categoryError.textContent = "";
    dateError.textContent = "";
    descriptionError.textContent = "";

    typeInput.classList.remove("input-error");
    amountInput.classList.remove("input-error");
    categoryInput.classList.remove("input-error");
    dateInput.classList.remove("input-error");
    descriptionInput.classList.remove("input-error");
}

function validateForm() {
    clearErrors();
    let isValid = true;

    if (!typeInput.value) {
        typeError.textContent = "Please select a transaction type.";
        typeInput.classList.add("input-error");
        isValid = false;
    }

    const amount = Number(amountInput.value);

    if (!amountInput.value) {
        amountError.textContent = "Please enter an amount.";
        amountInput.classList.add("input-error");
        isValid = false;
    } else if (amount <= 0) {
        amountError.textContent = "Amount must be greater than ₹0.";
        amountInput.classList.add("input-error");
        isValid = false;
    } else if (amount > 100000000) {
        amountError.textContent = "Amount is too large.";
        amountInput.classList.add("input-error");
        isValid = false;
    }

    if (!categoryInput.value) {
        categoryError.textContent = "Please select a category.";
        categoryInput.classList.add("input-error");
        isValid = false;
    }

    if (!dateInput.value) {
        dateError.textContent = "Please select a date.";
        dateInput.classList.add("input-error");
        isValid = false;
    } else {
        const selectedDate = dateInput.value;
        const currentDate = new Date();
        const todayString =
            currentDate.getFullYear() + "-" +
            String(currentDate.getMonth() + 1).padStart(2, "0") + "-" +
            String(currentDate.getDate()).padStart(2, "0");

        if (selectedDate > todayString) {
            dateError.textContent = "Future dates are not allowed.";
            dateInput.classList.add("input-error");
            isValid = false;
        }
    }

    const description = descriptionInput.value.trim();

    if (!description) {
        descriptionError.textContent = "Please enter a description.";
        descriptionInput.classList.add("input-error");
        isValid = false;
    } else if (description.length < 2) {
        descriptionError.textContent = "Description must contain at least 2 characters.";
        descriptionInput.classList.add("input-error");
        isValid = false;
    }

    return isValid;
}

function showNotification(message, type = "success") {
    notification.textContent = message;
    notification.className = `notification ${type} show`;

    setTimeout(function () {
        notification.classList.remove("show");
    }, 3000);
}

// Resets the form back to "add" mode (used after submit and on cancel)
function exitEditMode() {
    editingId = null;
    submitButton.textContent = "+ Add Transaction";
    cancelEditButton.classList.remove("visible");
    transactionForm.reset();
    clearErrors();
}

transactionForm.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!validateForm()) {
        showNotification("Please fix the errors.", "error");
        return;
    }

    const type = typeInput.value;
    const amount = Number(amountInput.value);
    const category = categoryInput.value;
    const date = dateInput.value;
    const description = descriptionInput.value.trim();

    if (editingId !== null) {
        const transaction = transactions.find(function (t) {
            return t.id === editingId;
        });

        if (transaction) {
            transaction.type = type;
            transaction.amount = amount;
            transaction.category = category;
            transaction.date = date;
            transaction.description = description;
        }

        showNotification("Transaction updated successfully!");
    } else {
        transactions.push({
            id: Date.now(),
            type: type,
            amount: amount,
            category: category,
            date: date,
            description: description
        });

        showNotification("Transaction added successfully!");
    }

    saveTransactions();
    displayTransactions();
    updateSummary();
    updateMonthlySummary();
    updateExpenseChart();
    exitEditMode();
});

function deleteTransaction(id) {
    const confirmDelete = confirm("Are you sure you want to delete this transaction?");
    if (!confirmDelete) return;

    transactions = transactions.filter(function (transaction) {
        return transaction.id !== id;
    });

    saveTransactions();
    displayTransactions();
    updateSummary();
    updateMonthlySummary();
    updateExpenseChart();

    // If the deleted transaction was mid-edit, back out of edit mode
    if (editingId === id) {
        exitEditMode();
    }

    showNotification("Transaction deleted successfully!");
}

function editTransaction(id) {
    const transaction = transactions.find(function (t) {
        return t.id === id;
    });

    if (!transaction) return;

    typeInput.value = transaction.type;
    amountInput.value = transaction.amount;
    categoryInput.value = transaction.category;
    dateInput.value = transaction.date;
    descriptionInput.value = transaction.description;

    editingId = id;
    submitButton.textContent = "Update Transaction";
    cancelEditButton.classList.add("visible");

    transactionForm.scrollIntoView({ behavior: "smooth" });
}

cancelEditButton.addEventListener("click", function () {
    exitEditMode();
});

// Filters and search
typeFilter.addEventListener("change", displayTransactions);
categoryFilter.addEventListener("change", displayTransactions);
searchInput.addEventListener("input", displayTransactions);
dateSearchInput.addEventListener("change", displayTransactions);

resetFiltersButton.addEventListener("click", function () {
    searchInput.value = "";
    dateSearchInput.value = "";
    typeFilter.value = "all";
    categoryFilter.value = "all";
    displayTransactions();
    showNotification("Filters have been reset.");
});

function exportToCSV() {
    const filteredTransactions = getFilteredTransactions();

    if (filteredTransactions.length === 0) {
        showNotification("No transactions available to export.", "error");
        return;
    }

    const headers = ["Type", "Amount", "Category", "Date", "Description"];

    const rows = filteredTransactions.map(function (transaction) {
        const safeDescription = String(transaction.description).replace(/"/g, '""');
        return [
            transaction.type,
            Number(transaction.amount).toFixed(2),
            transaction.category,
            transaction.date,
            `"${safeDescription}"`
        ];
    });

    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `expense-tracker-${new Date().toISOString().split("T")[0]}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showNotification(`${filteredTransactions.length} transaction(s) exported successfully!`);
}

exportButton.addEventListener("click", exportToCSV);

// Dark mode
function enableDarkMode() {
    document.body.classList.add("dark-mode");
    themeToggle.textContent = "☀️";
    themeToggle.setAttribute("title", "Switch to light mode");
    themeToggle.setAttribute("aria-label", "Switch to light mode");
    localStorage.setItem("theme", "dark");
}

function enableLightMode() {
    document.body.classList.remove("dark-mode");
    themeToggle.textContent = "🌙";
    themeToggle.setAttribute("title", "Switch to dark mode");
    themeToggle.setAttribute("aria-label", "Switch to dark mode");
    localStorage.setItem("theme", "light");
}

themeToggle.addEventListener("click", function () {
    if (document.body.classList.contains("dark-mode")) {
        enableLightMode();
    } else {
        enableDarkMode();
    }
});

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
    enableDarkMode();
} else {
    enableLightMode();
}

// Clear individual field errors as the user fixes them
typeInput.addEventListener("change", function () {
    typeError.textContent = "";
    typeInput.classList.remove("input-error");
});

amountInput.addEventListener("input", function () {
    amountError.textContent = "";
    amountInput.classList.remove("input-error");
});

categoryInput.addEventListener("change", function () {
    categoryError.textContent = "";
    categoryInput.classList.remove("input-error");
});

dateInput.addEventListener("change", function () {
    dateError.textContent = "";
    dateInput.classList.remove("input-error");
});

descriptionInput.addEventListener("input", function () {
    descriptionError.textContent = "";
    descriptionInput.classList.remove("input-error");
});

// Don't allow picking a future date
const localTodayString =
    today.getFullYear() + "-" +
    String(today.getMonth() + 1).padStart(2, "0") + "-" +
    String(today.getDate()).padStart(2, "0");
dateInput.max = localTodayString;

// Initial render
displayTransactions();
updateSummary();
updateMonthlySummary();
updateExpenseChart();