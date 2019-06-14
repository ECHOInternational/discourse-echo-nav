// Replace
// <i class="fa fa-search"></i>
// With
// <svg class="fa d-icon-search svg-icon svg-node" aria-hidden="true"><use xlink:href="#search"></use></svg>
$( document ).ready( function() {
	$('.fa-search').replaceWith(
		"<svg class='fa d-icon-search svg-icon svg-node' aria-hidden='true'><use xlink:href='#search'></use></svg>"
	);
	$('.fa-phone').replaceWith(
		"<svg class='fa d-icon-phone svg-icon svg-node' aria-hidden='true'><use xlink:href='#phone'></use></svg>"
	);
	$('.fa-user').replaceWith(
		"<svg class='fa d-icon-phone svg-icon svg-node' aria-hidden='true'><use xlink:href='#user'></use></svg>"
	);
});

$(document).on('click', '.search_mode', function(e){
  choose_search_type($(e.target).data("type"));
});

function choose_search_type(search_type){
  $('input[name="search_type"]').val(search_type);
  $('.current_selection').html(search_types[search_type].name);
  if($('.current_selection').is(":hidden")){
    $('.search_terms').attr("placeholder", search_types[search_type].placeholder_long);
  }else{
    $('.search_terms').attr("placeholder", search_types[search_type].placeholder_short);
  }
  $('.search-dropdown-menu').html(build_search_dropdown(search_type));
}

function build_search_dropdown(search_type){
  html_output = [];
  html_output.push("<li><a href='#' class='search_mode current' data-type='" + search_type + "'>"+ search_types[search_type].name +" <span class='caret'></span></a></li>");
  for(var tmp_search_type in search_types) {
    if(search_type != tmp_search_type){
      html_output.push("<li><a href='#' class='search_mode' data-type='" + tmp_search_type + "'>" + search_types[tmp_search_type].name + "</a></li>");
    }
  }
  return html_output.join("");
}