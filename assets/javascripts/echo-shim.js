// Replace
// <i class="fa fa-search"></i>
// With
// <svg class="fa d-icon-search svg-icon svg-node" aria-hidden="true"><use xlink:href="#search"></use></svg>
$( document ).ready( function() {
	$('.fa-search').replaceWith(
		"<svg class='fa d-icon-search svg-icon svg-node' aria-hidden='true'><use xlink:href='#search'></use></svg>"
	);
});