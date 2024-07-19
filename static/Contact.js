const forms = document.querySelectorAll('.needs-validation');

Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }
      else {
        event.preventDefault(); // Prevent the default form submission behavior.

        // Serialize the form data.
        var formData = $(event.currentTarget).serialize();

        // Reference the form for clearing input fields.
        var f = $(event.currentTarget);

        // Send the form data to the server asynchronously.
        $.ajax({
            type: "POST",
            url: "/contact-submitted",
            data: formData,
            success: function (response) {
                // Handle the server response here (e.g., display a success message).
                console.log(response);

                // Show the success alert.
                $(".sent-alert").removeClass("d-none");

                // Hide the success alert after a few seconds.
                setTimeout(function () {
                    $(".sent-alert").addClass("d-none");
                }, 5000);
            }
        });
      }
      form.classList.add('was-validated')
    }, false)
  })