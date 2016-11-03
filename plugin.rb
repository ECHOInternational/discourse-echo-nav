# name: ECHO Navigation
# about: UI Modifications to bring in the ECHO nav bar system tro the top of the forums
# version: 1.0.0
# authors: Nate Flood for ECHO Inc

# require 'pry'
# javascript
register_asset "javascripts/vendor/bootstrap.js"

# stylesheet
register_asset "stylesheets/echo-nav.css"

after_initialize do
	ApplicationController.class_eval do
    def set_layout
        File.expand_path('../app/views/layouts/echo.html.erb', __FILE__)
    end
  end
end