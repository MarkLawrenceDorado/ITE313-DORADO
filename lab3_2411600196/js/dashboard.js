document.addEventListener('DOMContentLoaded', function(){

    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if(isLoggedIn !== 'true'){
        window.location.href = 'index.html';
        return;
    }

    const username = localStorage.getItem('user') || "User";

    updateGreeting(username);
    updateStatistics();
    populateActivityTable();
    setupLogout();

    const userNameSpan = document.getElementById('userName');
    if(userNameSpan){
        userNameSpan.textContent = username;
    }
});

function updateGreeting(username){
    const greetingElement = document.getElementById('greeting');
    if(!greetingElement) return;

    const hour = new Date().getHours();
    let timeOfDay = "";
    if(hour >= 5 && hour < 12){
        timeOfDay = 'Good Morning';
    } else if (hour >= 12 && hour < 17){
        timeOfDay = "Good Afternoon"
    } else if (hour >= 17 && hour < 21){
        timeOfDay = 'Good Evening';
    }else {
        timeOfDay = 'Good Night';
    }
    greetingElement.textContent = `${timeOfDay}, ${username}!`;
}

function updateStatistics(){
    const stats = [
        {title: 'Total Orders', value: '1,284', color: 'text-primary', icon: '📦'},
        {title: 'Revenue', value: '$45,230', color: 'text-success', icon: '💰'},
        {title: 'New Customers', value: '342', color: 'text-info', icon: '👥'},
        {title: 'Return Rate', value: '2.4%', color: 'text-warning', icon: '📊'}
    ];

    const cardTitles = document.querySelectorAll('[id^="stat"][id$="-title"]');
    const cardValues = document.querySelectorAll('[id^="stat"][id$="-value"]');

    stats.forEach((stat, index) =>{
        const titleElement = document.getElementById(`stat${index + 1}-title`);
        const valueElement = document.getElementById(`stat${index + 1}-value`);

        if(titleElement){
            titleElement.textContent = `${stat.icon} ${stat. title}`;
        }
        if(valueElement){
            valueElement.textContent = stat.value;
            valueElement.className = `card-text fw-bold ${stat.color}`;
        }
    });
}

function populateActivityTable(){
    const tableBody = document.getElementById('activityTableBody');
    if(!tableBody) return;

    const activities = [
        {date: '2026-08-10 14:30', activity: 'New order received #ORD-4532', status: 'success'},
        {date: '2026-08-10 13:15', activity: 'Customer support ticket resolved', status: 'info'},
        {date: '2026-08-10 11:45', activity: 'Product inventory updated', status: 'warning'},
        {date: '2026-08-10 09:00', activity: 'New customer signed up', status: 'success'},
        {date: '2026-08-09 16:20', activity: 'Payment received for invoice #INV-312', status: 'success'},
        {date: '2026-08-09 14:30', activity: 'Shipping delay reported for order #ORD-4521', status: 'danger'}
    ];

    tableBody.innerHTML= '';

    activities.forEach(activity =>{
        const row = document.createElement('tr');
        
        let badgeClass = 'bg-secondary';
        if(activity.status ==='success') badgeClass = 'bg-success';
        else if(activity.status === 'warning') badgeClass = 'bg-warning text-dark';
        else if(activity.status === 'danger') badgeClass = 'bg-danger';
        else if(activity.status === 'info') badgeClass = 'bg-info text-dark';

        row.innerHTML = `
            <td>${activity.date}</td>
            <td>${activity.activity}</td>
            <td><span class="badge ${badgeClass}">${activity.status}</span></td>
        `;
        tableBody.appendChild(row);
    });
}

function setupLogout(){
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutLink = document.getElementById('logoutLink');

    function performLogout(e){
        e.preventDefault();

        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }

    if(logoutBtn){
        logoutBtn.addEventListener('click', performLogout);
    }
    if(logoutLink){
        logoutLink.addEventListener('click', performLogout);
    }
  
}