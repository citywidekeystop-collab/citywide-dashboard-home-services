// Citywide live local dashboard storage

function getJobs() {
return JSON.parse(localStorage.getItem("citywideJobs") || "[]");
}

function saveJobs(jobs) {
localStorage.setItem("citywideJobs", JSON.stringify(jobs));
}

function addJob(job) {
const jobs = getJobs();
jobs.unshift(job);
saveJobs(jobs);
}

function createBookingFromForm(form) {
const job = {
id: Date.now(),
name: form.name.value,
phone: form.phone.value,
address: form.address.value,
product: form.product.value,
style: form.style.value,
date: form.preferred_date.value,
time: form.preferred_time.value,
payment: form.payment_option.value,
details: form.details.value,
status: "New",
assignedTo: "Unassigned",
createdAt: new Date().toLocaleString()
};

addJob(job);
}
