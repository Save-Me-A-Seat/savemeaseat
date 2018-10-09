'use strict';

//---------------------------------------------------------------------------------------
//          MENU LOGIC
//
// Previously included code from this article:
// https://stackoverflow.com/questions/48614124/adding-another-nav-item-using-javascript-and-css
//
// Now all content is unique.
//
//---------------------------------------------------------------------------------------

function tongueMenuOpenOrClose()
{
  (document.querySelector('#tongue-menu-id').offsetWidth === 2) ? document.querySelector('#tongue-menu-id').style.width = '20em' : document.querySelector('#tongue-menu-id').style.width = '0em';
}

$('.tongue-menu-open-or-close').click(function()
{
  let substitute = $(this).clone(true);
  $(this).after(substitute);
  $(this).remove();
});
