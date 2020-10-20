Dir.glob('models/*.rb') { |model| require_relative model }

class Application < Sinatra::Base

    before do
        headers 'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => ['OPTIONS', 'GET', 'POST']
    end

    get '/?' do
        slim :index
    end

    get '/api/send/request/?' do
        headers = {
            'Authorization' => 'token  0f6c7734ee844ed44cfcc571d34e81f651c7a61f'
        }
        result = HTTParty.get(params['url'], :headers => headers)
        p result
        return result.to_json
    end
    
    get '/api/comments/get/?' do
        return SQLQuery.new.get('comments', ['id', 'text', 'sender']).where.if('projectId', params['projectId']).send.to_json
    end

    post '/api/comments/add/?' do
        SQLQuery.new.add('comments', ['text', 'projectId', 'sender'], [params['text'], params['projectId'], params['sender']]).send
    end
    
    delete '/api/comments/delete/?' do
        SQLQuery.new.del('comments').where.if('id', params['id']).send
    end
end