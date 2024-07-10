var selectedCanType; // Variable to store the selected can-type
var max;

$(document).ready(function(){
    $('.blue-image').on('click', function(){
        $("#hidden").val("Blue (Original)")
    });
    $('.pink-image').on('click', function(){
        $("#hidden").val("Pink (Terra)")
    });

    // Click event handler for the submit buttons
    $("#can-type-form input[type='submit']").click(function (event) {
        event.preventDefault(); // Prevent the default form submission behavior.
        
        // Get the value of the clicked submit button
        selectedCanType = $(this).val();
        if (selectedCanType == 'Blue (Original)')
        {
            max = blueMax;
        }
        else {
            max = pinkMax;
            $('#num-cans').attr('max', pinkMax);
            $('#num-cans-help').text('Please select a value between 1 and ' + pinkMax);
        }

        // Send the selected canType to the server asynchronously.
        $.ajax({
            type: "POST",
            url: "/can-type",
            data: { "can-type": selectedCanType }, // Send the selected can-type as data
        });
    });

    // Click event handler for the submit buttons
    $("#can-type-form input[type='image']").click(function (event) {
        event.preventDefault(); // Prevent the default form submission behavior.
        
        // Get the value of the clicked submit button
        selectedCanType = $("#can-type-form input[type='hidden']").val();
        if (selectedCanType == 'Blue (Original)')
        {
            max = blueMax;
        }
        else {
            max = pinkMax;
            $('#num-cans').attr('max', pinkMax);
            $('#num-cans-help').text('Please select a value between 1 and ' + pinkMax);
        }

        // Send the selected canType to the server asynchronously.
        $.ajax({
            type: "POST",
            url: "/can-type",
            data: { "can-type": selectedCanType }, // Send the selected can-type as data
        });
    });
});

document.addEventListener("DOMContentLoaded", function () {
    // Function to handle the button click
    function handleButtonClick(event) {
        // Get the element to fade out and remove
        const bluePink = document.querySelector('.blue-pink');
        const howMany = document.querySelector('.how-many');

        // Check if the element exists
        if (bluePink) {
            // Add a fade-out transition effect to the element
            bluePink.style.transition = 'opacity 0.5s';

            // Set the opacity to 0 for the fade-out effect
            bluePink.style.opacity = '0';

            // Wait for the transition to complete before removing the element
            setTimeout(() => {
                bluePink.remove();
                
                if (howMany) {
                    howMany.style.display = 'block';
                    // Add a fade-in transition effect to the second div
                    howMany.style.transition = 'opacity 0.5s';

                    // Set the opacity to 1 for the fade-in effect
                    howMany.style.opacity = '1';
                }
            }, 500); // 500 milliseconds matches the transition duration
        }
    }
    // Attach an event listener to the button click
    const submitBlue = document.querySelectorAll('.submit-blue');
    Array.from(submitBlue);
    if (submitBlue) {
        for(const sb of submitBlue)
            sb.addEventListener('click', handleButtonClick);
    }
    // Attach an event listener to the button click
    const submitPink = document.querySelectorAll('.submit-pink');
    Array.from(submitPink);
    if (submitPink) {
        for (const sp of submitPink)
            sp.addEventListener('click', handleButtonClick);
    }
});

let numCans = 0;

document.addEventListener("DOMContentLoaded", function () {
    // Function to handle the button click
    function handleSubmitClick(event) {
        var inputVal = parseInt($('#num-cans').val());
        if (inputVal <= max && inputVal > 0)
        {
            // Prevent the default button behavior
            event.preventDefault();

            // Serialize the form data.
            var formData = $("#num-cans-form").serialize();

            // Send the form data to the server asynchronously.
            $.ajax({
                type: "POST",
                url: "/num-cans",
                data: formData,
                success: function (response) {}
            });
            
            // Get the number of canisters input element
            const numCansInput = document.querySelector('#num-cans');
            numCans=numCansInput.value.trim();

            // Check if the input has a non-empty value
            if (numCansInput && numCansInput.value.trim() !== '') {
                // Get the element to fade out and remove
                const howManyDiv = document.querySelector('.how-many');

                // Check if the element exists
                if (howManyDiv) {
                    // Add a fade-out transition effect to the element
                    howManyDiv.style.transition = 'opacity 0.5s';

                    // Set the opacity to 0 for the fade-out effect
                    howManyDiv.style.opacity = '0';

                    // Wait for the transition to complete before removing the element
                    setTimeout(() => {
                        howManyDiv.remove();

                        const calendar = document.querySelector('.calendar');
                        
                        if (calendar) {
                            
                            calendar.style.display = 'block';
                            // Add a fade-in transition effect to the second div
                            calendar.style.transition = 'opacity 0.5s';

                            // Set the opacity to 1 for the fade-in effect
                            calendar.style.opacity = '1';
                        }
                    }, 500); // 500 milliseconds matches the transition duration
                }
            }
            if (numCansInput && numCansInput.value.trim() == '')
            {
                numCansInput.classList.add('is-invalid')
            }
        }
        else {

        }
    }

    // Attach an event listener to the button click
    const submitButton = document.querySelector('.submit-1');
    if (submitButton) {
        submitButton.addEventListener('click', handleSubmitClick);
    }
});

let date = "";
let a = availabilityByDayABlue;
let p = availabilityByDayPBlue;

const observer = new MutationObserver(function(mutationsList, observer) {
    // Check if there are 35 elements with the class "day"
    if ($('.day').length === 35) {
    $(".day").each(function() {
        let availability_day = $(this).text();
        let index = 0;
        if (month != Number(m)){
            index=1;
        }
        if (selectedCanType == "Pink (Terra)")
        {
            a = availabilityByDayAPink;
            p = availabilityByDayPPink;
        }
        if (daysOfWeek[availability_day-1] == 6) // If day is Saturday, check for availability assuming that no exchange is possible, friday night, saturday, or sunday morning
        {
            if (Number(p[index][availability_day-2]) + Number(a[index][availability_day-1]) + Number(p[index][availability_day-1]) + Number(a[index][availability_day]) + Number(numCans) > max){
                $(this).css('background-color', 'rgba(0, 0, 0, 0.1)');
                $(this).css('pointer-events', 'none');
            }
        }
    });
    }
});

// Start observing changes in the body element (you can change this to observe specific elements if needed)
observer.observe(document.body, { childList: true, subtree: true });

$(document).ready(function(){
    
    
    let lastClickedDate = ""; // Variable to store the last clicked date

    $('body').on('click', '.day', function(){
        let MONTH = Number(month) + 1;
        if (MONTH == "01") {
            MONTH = "1";
        }
        let dayClicked = $(this).text().trim()
        let date = MONTH + "_" + dayClicked + "_" + year;
        
        lastClickedDate = date; // Update the last clicked date

        // Function to update all hrefs within the modal with the last clicked date
        function updateLinks(date) {
            $('.day-modal a').each(function() {
                let href = $(this).attr('href'); // Get the href attribute value
                href = href.split('/')[0] + "/" + href.split('/')[1] + "/" + href.split('/')[2] + '/' + date; // Replace the existing date with the last clicked date
                $(this).attr('href', href); // Set the updated href attribute
            });
        }

        // Call the function with the last clicked date
        updateLinks(lastClickedDate);

        function updateAvailability(availabilityDay, availabilityMonth) {
            $('.day-modal a').each(function() { // For each time row in the current day-modal
                if (selectedCanType == "Pink (Terra)")
                {
                    a = availabilityByDayAPink;
                    p = availabilityByDayPPink;
                }
                let href = $(this).attr('href'); // Get the href attribute value (either 'a' or 'p')
                href = href.split('/')[2];
                let availabilityA = a[availabilityMonth-m-1][availabilityDay-1]; // Number of canisters booked for this morning
                let availabilityP = p[availabilityMonth-m-1][availabilityDay-1]; // Number of canisters booked for this evening

                // Reset the current day to be completely free, before checking for fully booked times
                $(this).css('background-color', 'rgba(184, 207, 55, 0.4)'); 
                $(this).css('pointer-events', 'auto');

                // If day is Friday, Saturday, or Sunday, combine friday afternoon, saturday and sunday morning into one time slot in case of absence on the weekend
                if (daysOfWeek[availabilityDay-1] == 5 && href == 'p' && (Number(availabilityP) + Number(a[availabilityMonth-m-1][availabilityDay]) + Number(p[availabilityMonth-m-1][availabilityDay]) + Number(a[availabilityMonth-m-1][availabilityDay+1])) > max) {
                    console.log("Friday");
                    $(this).css('background-color', 'rgba(0, 0, 0, 0.1)');
                    $(this).css('pointer-events', 'none');
                }
                else if (daysOfWeek[availabilityDay-1] == 6 && (Number(availabilityA) + Number(availabilityP) + Number(p[availabilityMonth-m-1][availabilityDay-2]) + Number(a[availabilityMonth-m-1][availabilityDay])) > max) {
                    console.log("Saturday");
                    $(this).css('background-color', 'rgba(0, 0, 0, 0.1)');
                    $(this).css('pointer-events', 'none');
                }
                else if (daysOfWeek[availabilityDay-1] == 7 && (Number(availabilityA) + Number(a[availabilityMonth-m-1][availabilityDay-2]) + Number(p[availabilityMonth-m-1][availabilityDay-2]) + Number(p[availabilityMonth-m-1][availabilityDay-3])) > max) {
                    console.log("Sunday");
                    $(this).css('background-color', 'rgba(0, 0, 0, 0.1)');
                    $(this).css('pointer-events', 'none');
                }
                else if (Number(availabilityA) + Number(numCans) > max && href=='a') // If the morning's bookings plus the number of canisters a customer has exceeds the max, then grey out the morning
                {
                    console.log('morning booked')
                    $(this).css('background-color', 'rgba(0, 0, 0, 0.1)');
                    $(this).css('pointer-events', 'none');
                }
                // Note the afternoon is not grayed out as I am usually around to exchange canisters in the afternoons
            });
        }
        updateAvailability(dayClicked, MONTH)

        let colour = $(this).css('background-color')
        if (colour == 'rgba(184, 207, 55, 0.4)' && currentTime > 17) // If it is the current day but it is after 5pm, the morning slot is unavailable
        {
            $('.day-modal a').each(function() {
                let href = $(this).attr('href'); // Get the href attribute value
                href = href.split('/')[2];
                if (href == 'a'){
                    console.log('after morning');
                    $(this).css('background-color', 'rgba(0, 0, 0, 0.1)');
                    $(this).css('pointer-events', 'none');
                }
            });
        }
    });
});

document.addEventListener("DOMContentLoaded", function () {
// Function to update the calendar based on the currentMonth and currentYear
function updateCalendar() {
    // Get the month and year elements
    let monthDiv = document.getElementById("month+year");
    monthDiv.textContent = monthsJson[month] + ", " + year
    let dates = document.getElementById("dates");

    // Define an array of month names
    const monthNames = [
        "January", "February", "March", "April",
        "May", "June", "July", "August",
        "September", "October", "November", "December"
    ];

    // Define an array of day names starting from Monday
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    // Clear the existing calendar
    dates.innerHTML = "";

    // Create a new date object for the current month and year
    let currentMonth = new Date(year, month, 1);

    // Calculate the day of the week for the first day of the month
    let firstDayOfWeek = currentMonth.getDay();

    // Set the displayed month and year
    monthDiv.textContent = monthNames[currentMonth.getMonth()] + ", " + currentMonth.getFullYear();

    // Calculate the number of days in the current month
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();

    // Create the calendar grid
    let row = document.createElement("div");
    row.classList.add("row");

    // Add column headers for the days of the week
    for (let i = 0; i < 7; i++) {
        let headerColumn = document.createElement("div");
        headerColumn.classList.add("col", "m-0", 'px-1', "text-center", "border", "border-secondary", "header");
        headerColumn.style.backgroundColor = "rgb(135, 204, 217)";

        if (i==0)
        {
            headerColumn.classList.add("ms-2");
        }
        if (i==6)
        {
            headerColumn.classList.add("me-2");
        }

        // Create an <h5> tag for the header text
        let headerText = document.createElement("h5");
        headerText.textContent = dayNames[i];

        headerColumn.appendChild(headerText);
        row.appendChild(headerColumn);
    }

    dates.appendChild(row);

    // Create a new row for the days of the month
    row = document.createElement("div");
    row.classList.add("row");

    if (firstDayOfWeek == 0)
    {
        firstDayOfWeek = 7;
    }

    // Add empty columns for the initial offset
    for (let i = 1; i < firstDayOfWeek; i++) {
        let emptyColumn = document.createElement("div");
        emptyColumn.classList.add("col", "m-0", "text-end", "border", "border-secondary", "day");
        if ($(window).width() < 576)
        {
            emptyColumn.style.minHeight = "60px";
        }
        else
        {
            emptyColumn.style.minHeight = "100px";
        }

        if (i==1)
        {
            emptyColumn.classList.add("ms-2");
        }

        emptyColumn.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
        row.appendChild(emptyColumn);
    }

    // Calculate the day of the week for the current day
    const currentDate = new Date();
    const currentDay = currentDate.getDate();

    // Loop through the days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        // Create a box for each day of the month
        let dayColumn = document.createElement("div");
        dayColumn.classList.add("col", "m-0", "text-end", "border", "border-secondary", "day");
        if ($(window).width() < 576)
        {
            dayColumn.style.minHeight = "60px";
        }
        else
        {
            dayColumn.style.minHeight = "100px";
        }
        dayColumn.style.position = "relative";

        let y = 1;
        if (firstDayOfWeek==1) {y=0;}
        if ((day%7)==(y+(7-firstDayOfWeek)%6))
        {
            dayColumn.classList.add("me-2");
        }

        let x=2;
        if (firstDayOfWeek==1) {x=1;}
        if ((day+firstDayOfWeek-1)%7 == 1) //FIX THIS
        {
            dayColumn.classList.add("ms-2");
        }

        // Create an <h5> tag for the day number
        let dayNumber = document.createElement("h5");
        dayNumber.textContent = day;
        dayNumber.style.position = "absolute";
        dayNumber.style.top = "5px";
        dayNumber.style.right = "5px";

        // Check if it's the current day and apply styling accordingly (green bg)
        if (
            currentMonth.getFullYear() === currentDate.getFullYear() &&
            currentMonth.getMonth() === currentDate.getMonth() &&
            day === currentDay
        ) {
            if (time > 20)
            {
                dayColumn.setAttribute('data-bs-toggle', 'modal')
                dayColumn.setAttribute('data-bs-target', '#Wrong-Time')
            }
            else
            {
                dayColumn.setAttribute('data-bs-toggle', 'modal')
                dayColumn.setAttribute('data-bs-target', '#day-modal')
            }
            dayColumn.classList.add("today");
            dayColumn.style.backgroundColor = "rgba(184, 207, 55, 0.4)";
            dayColumn.classList.add("clickable");
        } else if (
            currentMonth.getFullYear() > currentDate.getFullYear() ||
            (currentMonth.getFullYear() === currentDate.getFullYear() &&
                currentMonth.getMonth() > currentDate.getMonth()) ||
            (currentMonth.getFullYear() === currentDate.getFullYear() &&
                currentMonth.getMonth() === currentDate.getMonth() &&
                day > currentDay)
        ) {
            dayColumn.style.backgroundColor = "white";
            dayColumn.classList.add("clickable");
            dayColumn.setAttribute('data-bs-toggle', 'modal')
            dayColumn.setAttribute('data-bs-target', '#day-modal')
        } else {
            dayColumn.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
        }

        // Add a click event to handle selecting the day (customize this as needed)
        dayColumn.addEventListener("click", function () {
            // Handle selecting the day here (e.g., displaying a modal)
            if (dayColumn.className.includes("clickable")) {}
        });

        dayColumn.appendChild(dayNumber);
        row.appendChild(dayColumn);

        // Start a new row every 7 columns (for the week)
        if (row.children.length === 7 || day === daysInMonth) {
            dates.appendChild(row);
            row = document.createElement("div");
            row.classList.add("row");
        }
    }

    // Add empty columns to the right for the final row to ensure it has 7 columns
    const lastRow = dates.lastChild;
    while (lastRow.children.length < 7) {
        let emptyColumn = document.createElement("div");
        emptyColumn.classList.add("col", "m-0", "text-end", "border", "border-secondary", "day");
        if ($(window).width() < 576)
        {
            emptyColumn.style.minHeight = "60px";
        }
        else
        {
            emptyColumn.style.minHeight = "100px";
        }
        if (lastRow.children.length == 6)
        {
            emptyColumn.classList.add("me-2");
        }
        emptyColumn.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
        lastRow.appendChild(emptyColumn);
    }
}

    // Button click event handlers
    document.getElementById("prev-month-btn").addEventListener("click", function () {
        // Decrement the currentMonth and update the calendar
        if (month > m || year>y)
        {
            month--;
            if (month < 0) {
                month = 11;
                year--;
            }
            updateCalendar();
        }
    });

    document.getElementById("nxt-month-btn").addEventListener("click", function () {
        // Increment the currentMonth and update the calendar
        if (month < Number(m)+1)
        {
            month++;
        }
        if (month > 11) {
            month = 0;
            year++;
        }
        updateCalendar();
    });
});

$(document).ready(function () {
    $("#num-cans-form").submit(function (event) {
        event.preventDefault(); // Prevent the default form submission behavior.

        // Serialize the form data.
        var formData = $(this).serialize();

        // Send the form data to the server asynchronously.
        $.ajax({
            type: "POST",
            url: "/num-cans",
            data: formData,
            success: function (response) {
                // Handle the server response here (e.g., display a success message).
                //console.log(response);
            }
        });
    });
});

// Change date box sizes if the screen becomes small
if ($(window).width() < 576)
    {
        $(".day").css('min-height', '60px');
    }
    else
    {
        $(".day").css('min-height', '100px');
    }
$(window).resize(function () {
    if ($(window).width() < 576)
    {
        $(".day").css('min-height', '60px');
    }
    else
    {
        $(".day").css('min-height', '100px');
    }
});