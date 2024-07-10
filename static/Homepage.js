$(document).ready(function () {
    // Function to toggle the carousel
    function toggleCarousel() {
        if ($(window).width() <= 1200) {
            $('#imageCarousel').removeClass('d-none');
            $('#imageCarousel').addClass('d-block');
            $('#customer-testimonials').removeClass('d-block');
            $('#customer-testimonials').addClass('d-none');
            $('[id=bubbles]').removeClass('d-none');
            $('[id=bubbles]').addClass('d-md-block');
        } else {
            $('#imageCarousel').addClass('d-none');
            $('#imageCarousel').removeClass('d-block');
            $('[id=bubbles]').removeClass('d-md-block');
            $('[id=bubbles]').addClass('d-none');
            $('#customer-testimonials').removeClass('d-none');
            $('#customer-testimonials').addClass('d-block');
        }
        if ($(window).width() < 576)
        {
            $('[id=bubbles]').removeClass('d-md-block');
            $('[id=bubbles]').addClass('d-none');
            document.querySelector('.carousel-image-1').src = '../static/Logo-trans.png';           
        }
    }

    // Initial toggle
    toggleCarousel();

    // Recheck on window resize
    $(window).resize(function () {
        toggleCarousel();
    });
});