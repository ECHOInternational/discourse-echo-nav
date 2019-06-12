# name: ECHO Navigation
# about: UI Modifications to bring in the ECHO nav bar system to the top of the forums
# version: 2.4.2
# authors: Nate Flood for ECHO Inc

# javascript
register_asset "javascripts/vendor/bootstrap.js"
register_asset "javascripts/echo-shim.js"

# stylesheet
register_asset "stylesheets/echo-nav.css"

# custom html
register_html_builder('server:header') do |controller|
	Rails.cache.fetch("header_#{I18n.locale}", expires_in: 1.day) do
		newheader = "<div class='echocommunity_core'>"
		begin
			newheader += open("https://www.echocommunity.org/#{I18n.locale}/remote/header", :read_timeout => 10).read
			newheader += open("https://www.echocommunity.org/#{I18n.locale}/remote/navigation", :read_timeout => 10).read
			newheader += open("https://www.echocommunity.org/#{I18n.locale}/remote/language", :read_timeout => 10).read
		rescue OpenURI::HTTPError => e
			newheader += "An Error Occurred: " + e.message
		end
		newheader += "</div>"
		newheader
	end
end

register_html_builder('server:before-body-close') do |controller|
	Rails.cache.fetch("footer_#{I18n.locale}", expires_in: 1.day) do
		newfooter = "<div class='echocommunity_core'><div class='container-fluid'>"
		begin
			newfooter += open("https://www.echocommunity.org/#{I18n.locale}/remote/footer", :read_timeout => 10).read
		rescue OpenURI::HTTPError => e
			newfooter += "An Error Occurred: " + e.message
		end
		newfooter += "</div></div>"
		newfooter
	end
end
