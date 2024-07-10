const forms = document.querySelectorAll('.needs-validation')
const passInput = document.getElementById('pass-in');
const confirmPassInput = document.getElementById('pass-confirm');

Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }
      if (confirmPassInput.value != passInput.value) {
        console.log("passwords dont match")
          confirmPassInput.setCustomValidity("Passwords don't match");
      } else {
          confirmPassInput.setCustomValidity('');
      }
      form.classList.add('was-validated')
    }, false)
  })

// Add an event listener to the confirm email input
confirmPassInput.addEventListener('input', function () {
    if (confirmPassInput.value != passInput.value) {
      console.log("passwords dont match")
        confirmPassInput.setCustomValidity("Passwords don't match");
    } else {
        confirmPassInput.setCustomValidity('');
    }
});