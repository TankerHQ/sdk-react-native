# tanker-client-react-native.podspec

require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "tanker-client-react-native"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.description  = <<-DESC
                  tanker-client-react-native
                   DESC
  s.homepage     = "https://github.com/TankerHQ/tanker-client-react-native"
  # brief license entry:
  s.license      = "Apache 2"
  # optional - use expanded license entry instead:
  # s.license    = { :type => "Apache 2", :file => "LICENSE" }
  s.authors      = { "Tanker Team" => "tech@tanker.io" }
  s.platforms    = { :ios => "9.0" }
  s.source       = { :git => "https://github.com/TankerHQ/tanker-client-react-native.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,c,cc,cpp,m,mm,swift}"
  s.requires_arc = true

  s.dependency "React"
  # ...
  # s.dependency "..."
end

